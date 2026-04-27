import { normalizeSearchText, type CardCatalogSummary } from "@/lib/cards/catalog";
import { getCardBaseName } from "@/lib/cards/identity";
import { queryCards } from "@/lib/cards/query";
import type { GameSlug } from "@/lib/games";

import type {
  ScannerCatalogCandidate,
  ScannerDetectionHint,
} from "./types";

type CandidateScore = {
  card: CardCatalogSummary;
  matchScore: number;
  searchQuery: string;
};

function normalizeLooseValue(value: string | null | undefined) {
  return normalizeSearchText(value ?? "");
}

function normalizeCollectorNumber(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function buildScannerQueries(hint: ScannerDetectionHint) {
  const queries = [
    [hint.name, hint.numberGuess, hint.setGuess].filter(Boolean).join(" "),
    [hint.name, hint.setGuess].filter(Boolean).join(" "),
    [hint.name, hint.numberGuess].filter(Boolean).join(" "),
    hint.name ?? "",
    [hint.setGuess, hint.numberGuess].filter(Boolean).join(" "),
  ];

  return [...new Set(queries.map((query) => query.trim()).filter(Boolean))].slice(0, 4);
}

export function scoreScannerCardMatch(
  card: CardCatalogSummary,
  hint: ScannerDetectionHint,
): number {
  let score = 0;
  const normalizedHintName = normalizeLooseValue(hint.name);
  const normalizedCardName = normalizeLooseValue(card.name);
  const normalizedCardBaseName = normalizeLooseValue(getCardBaseName(card.name));
  const normalizedSetGuess = normalizeLooseValue(hint.setGuess);
  const normalizedCardSet = normalizeLooseValue(card.setName ?? card.setCode);
  const normalizedNumberGuess = normalizeCollectorNumber(hint.numberGuess);
  const normalizedCollectorNo = normalizeCollectorNumber(card.collectorNo);
  const normalizedRarityGuess = normalizeLooseValue(hint.rarityGuess);
  const normalizedCardRarity = normalizeLooseValue(card.rarity);
  const normalizedFinishGuess = normalizeLooseValue(hint.finishGuess);
  const normalizedVersionLabel = normalizeLooseValue(card.versionLabel ?? card.rarity ?? "");

  if (normalizedHintName) {
    if (normalizedCardName === normalizedHintName || normalizedCardBaseName === normalizedHintName) {
      score += 55;
    } else if (
      normalizedCardName.includes(normalizedHintName) ||
      normalizedHintName.includes(normalizedCardBaseName)
    ) {
      score += 30;
    } else if (normalizedHintName.split(/\s+/).every((token) => normalizedCardName.includes(token))) {
      score += 22;
    }
  }

  if (normalizedSetGuess) {
    if (normalizedCardSet === normalizedSetGuess) {
      score += 18;
    } else if (
      normalizedCardSet.includes(normalizedSetGuess) ||
      normalizedSetGuess.includes(normalizedCardSet)
    ) {
      score += 10;
    }
  }

  if (normalizedNumberGuess) {
    if (normalizedCollectorNo === normalizedNumberGuess) {
      score += 28;
    } else if (
      normalizedCollectorNo &&
      (normalizedCollectorNo.includes(normalizedNumberGuess) ||
        normalizedNumberGuess.includes(normalizedCollectorNo))
    ) {
      score += 12;
    }
  }

  if (normalizedRarityGuess && normalizedCardRarity) {
    if (normalizedCardRarity === normalizedRarityGuess) {
      score += 8;
    } else if (normalizedCardRarity.includes(normalizedRarityGuess)) {
      score += 4;
    }
  }

  if (normalizedFinishGuess && normalizedVersionLabel) {
    if (normalizedVersionLabel.includes(normalizedFinishGuess)) {
      score += 6;
    }
  }

  score += Math.round(Math.min(Math.max(hint.confidence, 0), 1) * 8);
  return score;
}

async function queryScannerCandidates(
  game: GameSlug,
  query: string,
) {
  const results = await queryCards({
    game,
    q: query,
    page: 1,
    pageSize: 12,
    filters: {
      domains: [],
      rarities: [],
      sets: [],
      types: [],
    },
    sort: "name-asc",
    versionMode: "premium",
  });

  return results.cards;
}

export async function matchScannerCandidates(
  game: GameSlug,
  hint: ScannerDetectionHint,
): Promise<ScannerCatalogCandidate[]> {
  const queries = buildScannerQueries(hint);
  if (queries.length === 0) {
    return [];
  }

  const deduped = new Map<string, CandidateScore>();

  for (const query of queries) {
    const cards = await queryScannerCandidates(game, query);
    for (const card of cards) {
      const financeProductId = card.financeProductId ?? card.id;
      const nextScore = scoreScannerCardMatch(card, hint);
      const existing = deduped.get(financeProductId);

      if (!existing || nextScore > existing.matchScore) {
        deduped.set(financeProductId, {
          card,
          matchScore: nextScore,
          searchQuery: query,
        });
      }
    }
  }

  return [...deduped.values()]
    .filter((candidate) => candidate.matchScore > 0)
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }

      return (right.card.fairValue ?? 0) - (left.card.fairValue ?? 0);
    })
    .slice(0, 5)
    .map((candidate) => ({
      financeProductId: candidate.card.financeProductId ?? candidate.card.id,
      matchedCardName: candidate.card.name,
      matchScore: candidate.matchScore,
      confidence: Math.min(
        0.99,
        Math.max(hint.confidence * 0.6, candidate.matchScore / 100),
      ),
      searchQuery: candidate.searchQuery,
      guess: hint,
    }));
}
