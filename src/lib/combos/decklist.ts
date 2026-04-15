import { normalizeSearchText } from "@/lib/cards/catalog";
import { normalizeCardIdentityName } from "@/lib/cards/identity";
import type { GameSlug } from "@/lib/games";

import {
  getComboCatalogLookup,
  resolveCatalogCard,
  toComboPieceCardData,
} from "./catalog";
import type {
  ComboAnalyzeCardInput,
  ComboAnalyzeDeckCard,
  DecklistParseResult,
  ParsedDeckEntry,
} from "./types";

const COMMENT_PREFIXES = ["#", "//", "--", ";"];
const HEADER_PATTERN =
  /^(main|mainboard|sideboard|commander|commanders|companion|companions|maybeboard|deck|decklist)\b/i;

function stripInlineComment(line: string) {
  let working = line;
  for (const prefix of COMMENT_PREFIXES) {
    const markerIndex = working.indexOf(` ${prefix}`);
    if (markerIndex > 0) {
      working = working.slice(0, markerIndex).trim();
    }
  }
  return working.trim();
}

function cleanCardName(raw: string) {
  return raw
    .replace(/\s+\[[^\]]+\]\s*\d+[a-z]*$/i, "")
    .replace(/\s+\([A-Z0-9]{2,8}\)\s*\d+[a-z]*$/i, "")
    .replace(/\s+\{[^}]+\}$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeCardName(value: string) {
  return /[a-z]/i.test(value);
}

function parseQuantityPrefixedLine(line: string) {
  const match = line.match(/^(\d+)\s*x?\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const quantity = Number.parseInt(match[1] ?? "1", 10);
  const cardName = cleanCardName(match[2] ?? "");
  if (!Number.isFinite(quantity) || quantity <= 0 || !cardName) {
    return null;
  }

  return { quantity, cardName };
}

function parseQuantitySuffixedLine(line: string) {
  const match = line.match(/^(.+?)\s+x?(\d+)$/i);
  if (!match) {
    return null;
  }

  const quantity = Number.parseInt(match[2] ?? "1", 10);
  const cardName = cleanCardName(match[1] ?? "");
  if (!Number.isFinite(quantity) || quantity <= 0 || !cardName) {
    return null;
  }

  return { quantity, cardName };
}

function mergeEntries(entries: ParsedDeckEntry[]) {
  const merged = new Map<string, ParsedDeckEntry>();

  for (const entry of entries) {
    const existing = merged.get(entry.normalizedName);
    if (existing) {
      existing.quantity += entry.quantity;
      continue;
    }

    merged.set(entry.normalizedName, { ...entry });
  }

  return [...merged.values()];
}

export function parseDecklistText(deckText: string): DecklistParseResult {
  const entries: ParsedDeckEntry[] = [];
  const unresolvedLines: DecklistParseResult["unresolvedLines"] = [];
  const warnings: string[] = [];
  const lines = deckText.split(/\r?\n/);

  for (const originalLine of lines) {
    const trimmed = originalLine.trim();
    if (!trimmed) {
      continue;
    }

    if (
      COMMENT_PREFIXES.some((prefix) => trimmed.startsWith(prefix)) ||
      HEADER_PATTERN.test(trimmed)
    ) {
      continue;
    }

    const withoutComment = stripInlineComment(trimmed);
    const parsed =
      parseQuantityPrefixedLine(withoutComment) ??
      parseQuantitySuffixedLine(withoutComment) ?? {
        quantity: 1,
        cardName: cleanCardName(withoutComment),
      };

    if (!parsed.cardName || !looksLikeCardName(parsed.cardName)) {
      unresolvedLines.push({
        line: originalLine,
        reason: "Could not find a card name on this line.",
      });
      continue;
    }

    entries.push({
      quantity: parsed.quantity,
      cardName: parsed.cardName,
      normalizedName: normalizeCardIdentityName(parsed.cardName),
    });
  }

  const mergedEntries = mergeEntries(entries);
  if (mergedEntries.length < entries.length) {
    warnings.push("Duplicate decklist lines were merged by normalized card name.");
  }

  return {
    entries: mergedEntries,
    unresolvedLines,
    warnings,
  };
}

function mergeResolvedDeckCards(cards: ComboAnalyzeDeckCard[]) {
  const merged = new Map<string, ComboAnalyzeDeckCard>();

  for (const card of cards) {
    const key = card.familyKey || normalizeSearchText(card.cardName);
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += card.quantity;
      continue;
    }
    merged.set(key, { ...card });
  }

  return [...merged.values()];
}

export async function resolveParsedDeckEntries(
  game: GameSlug,
  parseResult: DecklistParseResult,
) {
  const lookup = await getComboCatalogLookup(game);
  const unresolvedLines = [...parseResult.unresolvedLines];
  const resolved = parseResult.entries.flatMap((entry) => {
    const card = resolveCatalogCard(lookup, { cardName: entry.cardName });
    if (!card) {
      unresolvedLines.push({
        line: `${entry.quantity} ${entry.cardName}`,
        reason: "Card name did not match the current catalog for this game.",
      });
      return [];
    }

    return [
      toComboPieceCardData(card, {
        familyKey: card.familyKey,
        cardName: entry.cardName,
        quantity: entry.quantity,
      }),
    ];
  });

  return {
    parseResult: {
      ...parseResult,
      unresolvedLines,
    },
    deckCards: mergeResolvedDeckCards(resolved),
  };
}

export async function resolveScratchCards(
  game: GameSlug,
  scratchCards: ComboAnalyzeCardInput[],
) {
  const lookup = await getComboCatalogLookup(game);
  const resolved = scratchCards.map((card) => {
    const resolvedCard = resolveCatalogCard(lookup, {
      familyKey: card.familyKey ?? null,
      cardName: card.cardName,
    });

    if (!resolvedCard) {
      return {
        familyKey: card.familyKey ?? normalizeCardIdentityName(card.cardName),
        cardName: card.cardName,
        quantity: card.quantity,
        cardId: null,
        imageUrl: card.imageUrl ?? null,
        typeLine: card.typeLine ?? null,
        text: card.text ?? null,
        domains: card.domains ?? [],
        energyCost: card.energyCost ?? null,
        power: card.power ?? null,
        might: card.might ?? null,
        hp: card.hp ?? null,
      } satisfies ComboAnalyzeDeckCard;
    }

    return toComboPieceCardData(resolvedCard, {
      familyKey: card.familyKey,
      cardName: card.cardName,
      quantity: card.quantity,
    });
  });

  return mergeResolvedDeckCards(resolved);
}
