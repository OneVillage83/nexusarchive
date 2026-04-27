import type { DeckBuilderEntry } from "@/lib/decks/config";
import {
  getDeckById,
} from "@/lib/decks/query";
import type { GameSlug } from "@/lib/games";
import { buildGamePath } from "@/lib/games";

import { buildSynergySuggestions } from "./engine";
import {
  parseDecklistText,
  resolveParsedDeckEntries,
  resolveScratchCards,
} from "./decklist";
import { getAllComboResults } from "./query";
import type {
  ComboAnalyzeDeckCard,
  ComboAnalyzeRequest,
  ComboAnalyzeResponse,
  ComboPiece,
  ComboResultSummary,
} from "./types";

function toAnalyzeDeckCard(entry: DeckBuilderEntry): ComboAnalyzeDeckCard {
  return {
    familyKey: entry.familyKey,
    cardName: entry.cardName,
    quantity: entry.quantity,
    cardId: entry.displayCardId ?? null,
    imageUrl: entry.imageUrl ?? null,
    typeLine: entry.typeLine ?? null,
    text: entry.text ?? null,
    domains: entry.domainValues,
    energyCost: entry.cost ?? null,
    power: entry.power ?? null,
    might: entry.might ?? null,
    hp: entry.hp ?? null,
  };
}

function buildDeckCardMap(deckCards: ComboAnalyzeDeckCard[]) {
  const counts = new Map<string, number>();
  for (const card of deckCards) {
    counts.set(card.familyKey, (counts.get(card.familyKey) ?? 0) + card.quantity);
  }
  return counts;
}

function shouldCountForMatching(piece: ComboPiece) {
  return piece.role !== "template";
}

function clonePiece(piece: ComboPiece) {
  return {
    ...piece,
    domains: [...piece.domains],
  };
}

export function matchComboAgainstDeck(
  combo: ComboResultSummary,
  bucket: "exactMatches" | "nearMisses",
  deckCardCounts: Map<string, number>,
): ComboResultSummary | null {
  const ownedPieces: ComboPiece[] = [];
  const missingPieces: ComboPiece[] = [];
  let countedRequiredPieces = 0;

  for (const piece of combo.pieces.filter(shouldCountForMatching)) {
    countedRequiredPieces += 1;
    const ownedQuantity = deckCardCounts.get(piece.familyKey) ?? 0;
    if (ownedQuantity >= piece.quantity) {
      ownedPieces.push(clonePiece(piece));
    } else {
      missingPieces.push(clonePiece(piece));
    }
  }

  const missingUniquePieces = missingPieces.length;
  if (bucket === "exactMatches" && missingUniquePieces > 0) {
    return null;
  }

  if (bucket === "nearMisses") {
    if (missingUniquePieces === 0 || missingUniquePieces > 2 || ownedPieces.length === 0) {
      return null;
    }
  }

  return {
    ...combo,
    match: {
      bucket,
      ownedPieces,
      missingPieces,
      ownedCount: ownedPieces.length,
      totalCount: countedRequiredPieces,
      confidence:
        bucket === "exactMatches"
          ? 1
          : Math.max(0.35, 1 - missingUniquePieces / Math.max(countedRequiredPieces, 1)),
      reason:
        bucket === "exactMatches"
          ? "All required combo pieces are already present in this deck."
          : `This deck is ${missingUniquePieces} piece${missingUniquePieces === 1 ? "" : "s"} away from the full line.`,
    },
    href: `${buildGamePath(combo.game, "combos")}?selected=${encodeURIComponent(combo.slug)}`,
  } satisfies ComboResultSummary;
}

async function resolveSavedDeckInput(
  game: GameSlug,
  deckId: number,
  viewerUserId: string | null,
) {
  const deck = await getDeckById({
    game,
    deckId,
    viewerUserId,
  });

  if (!deck) {
    throw new Error("Saved deck not found or unavailable.");
  }

  return {
    deck,
    deckCards: deck.entries.map(toAnalyzeDeckCard),
  };
}

async function resolveAnalyzeDeckCards(
  request: ComboAnalyzeRequest,
  viewerUserId: string | null,
) {
  if (request.inputSource === "saved") {
    if (!request.deckId) {
      throw new Error("A saved deck analysis needs a deck id.");
    }

    const saved = await resolveSavedDeckInput(request.game, request.deckId, viewerUserId);
    return {
      parseResult: null,
      deck: saved.deck,
      deckCards: saved.deckCards,
    };
  }

  if (request.inputSource === "scratch") {
    const deckCards = await resolveScratchCards(request.game, request.scratchCards ?? []);
    return {
      parseResult: null,
      deck: null,
      deckCards,
    };
  }

  const parseResult = parseDecklistText(request.deckText ?? "");
  const resolved = await resolveParsedDeckEntries(request.game, parseResult);
  return {
    parseResult: resolved.parseResult,
    deck: null,
    deckCards: resolved.deckCards,
  };
}

function sortMatches(results: ComboResultSummary[]) {
  return [...results].sort((left, right) => {
    const leftPopularity = left.popularity ?? 0;
    const rightPopularity = right.popularity ?? 0;
    if (leftPopularity !== rightPopularity) {
      return rightPopularity - leftPopularity;
    }

    return left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
    });
  });
}

function isComboResultSummary(
  value: ComboResultSummary | null,
): value is ComboResultSummary {
  return Boolean(value);
}

export async function analyzeCombos(
  request: ComboAnalyzeRequest,
  viewerUserId: string | null,
): Promise<ComboAnalyzeResponse> {
  const resolved = await resolveAnalyzeDeckCards(request, viewerUserId);
  const combos = await getAllComboResults(request.game);
  const deckCardCounts = buildDeckCardMap(resolved.deckCards);

  const exactMatches = sortMatches(
    combos
      .map((combo) => matchComboAgainstDeck(combo, "exactMatches", deckCardCounts))
      .filter(isComboResultSummary),
  );

  const nearMisses = sortMatches(
    combos
      .map((combo) => matchComboAgainstDeck(combo, "nearMisses", deckCardCounts))
      .filter(isComboResultSummary),
  );

  const synergySuggestions = buildSynergySuggestions(
    request.game,
    resolved.deckCards,
    (slug) => `${buildGamePath(request.game, "combos")}?selected=${encodeURIComponent(slug)}`,
  );

  return {
    game: request.game,
    inputSource: request.inputSource,
    deckCards: resolved.deckCards,
    parseResult: resolved.parseResult,
    exactMatches,
    nearMisses,
    synergySuggestions,
  };
}
