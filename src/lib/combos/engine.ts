import { compactText, normalizeSearchText } from "@/lib/cards/catalog";

import type {
  ComboAnalyzeDeckCard,
  ComboPiece,
  ComboResultSummary,
} from "./types";

const RULE_TOKEN_GROUPS: Record<string, string[]> = {
  draw: ["draw", "scry", "investigate", "loot"],
  token: ["token", "create", "copy", "populate"],
  sacrifice: ["sacrifice", "dies", "death", "destroy"],
  cast: ["cast", "spell", "instant", "sorcery", "magecraft"],
  mana: ["mana", "treasure", "add", "untap", "cost"],
  graveyard: ["graveyard", "discard", "mill", "reanimate", "return"],
  attack: ["attack", "combat", "damage", "creature", "equip"],
};

const PAYOFF_PAIRS: Array<{
  producer: string[];
  payoff: string[];
  label: string;
}> = [
  {
    producer: ["token", "create", "copy"],
    payoff: ["sacrifice", "dies", "death"],
    label: "Token engine feeds sacrifice payoffs",
  },
  {
    producer: ["untap", "mana", "treasure", "add"],
    payoff: ["cast", "storm", "spell"],
    label: "Mana acceleration feeds repeated spell casts",
  },
  {
    producer: ["mill", "discard", "sacrifice"],
    payoff: ["graveyard", "return", "reanimate"],
    label: "Self-loading the graveyard supports recursion",
  },
  {
    producer: ["draw", "scry", "loot"],
    payoff: ["cast", "copy", "magecraft"],
    label: "Card flow helps keep the engine looping",
  },
];

type SynergyScore = {
  score: number;
  confidence: number;
  reasons: string[];
};

function getRuleTokens(card: Pick<ComboAnalyzeDeckCard, "cardName" | "text" | "typeLine">) {
  const normalized = normalizeSearchText(
    [card.cardName, card.text ?? "", card.typeLine ?? ""].join(" "),
  );
  return new Set(normalized.split(/\s+/).filter((token) => token.length > 2));
}

function countSharedTypeTokens(
  left: Pick<ComboAnalyzeDeckCard, "typeLine">,
  right: Pick<ComboAnalyzeDeckCard, "typeLine">,
) {
  const leftTokens = new Set(
    normalizeSearchText(left.typeLine ?? "")
      .split(/\s+/)
      .filter(Boolean),
  );

  return normalizeSearchText(right.typeLine ?? "")
    .split(/\s+/)
    .filter((token) => leftTokens.has(token));
}

function hasAnyToken(tokens: Set<string>, candidates: string[]) {
  return candidates.some((candidate) => tokens.has(candidate));
}

export function scoreComboSynergyPair(
  left: ComboAnalyzeDeckCard,
  right: ComboAnalyzeDeckCard,
): SynergyScore {
  if (left.familyKey === right.familyKey) {
    return {
      score: Number.NEGATIVE_INFINITY,
      confidence: 0,
      reasons: ["Same exact card family."],
    };
  }

  let score = 0;
  const reasons: string[] = [];

  const sharedDomains = left.domains.filter((domain) => right.domains.includes(domain));
  if (sharedDomains.length > 0) {
    score += sharedDomains.length * 12;
    reasons.push(`Shares ${sharedDomains.join(", ")}`);
  }

  const sharedTypeTokens = countSharedTypeTokens(left, right);
  if (sharedTypeTokens.length > 0) {
    score += Math.min(sharedTypeTokens.length, 3) * 7;
    reasons.push(`Shared type identity (${sharedTypeTokens[0]})`);
  }

  const leftRuleTokens = getRuleTokens(left);
  const rightRuleTokens = getRuleTokens(right);
  const sharedRuleTokens = [...rightRuleTokens].filter((token) => leftRuleTokens.has(token));
  if (sharedRuleTokens.length > 0) {
    score += Math.min(sharedRuleTokens.length, 4) * 3;
    reasons.push(`Rules text overlaps around ${sharedRuleTokens[0]}`);
  }

  for (const pair of PAYOFF_PAIRS) {
    if (
      (hasAnyToken(leftRuleTokens, pair.producer) && hasAnyToken(rightRuleTokens, pair.payoff)) ||
      (hasAnyToken(rightRuleTokens, pair.producer) && hasAnyToken(leftRuleTokens, pair.payoff))
    ) {
      score += 15;
      reasons.push(pair.label);
      break;
    }
  }

  const leftCost = left.energyCost ?? null;
  const rightCost = right.energyCost ?? null;
  if (leftCost != null && rightCost != null) {
    const costDelta = Math.abs(leftCost - rightCost);
    if (costDelta <= 2) {
      score += 5;
      reasons.push("Curve fits into the same turn window");
    }
  }

  for (const [groupLabel, groupTokens] of Object.entries(RULE_TOKEN_GROUPS)) {
    if (hasAnyToken(leftRuleTokens, groupTokens) && hasAnyToken(rightRuleTokens, groupTokens)) {
      score += 4;
      reasons.push(`Both cards point at ${groupLabel} synergies`);
    }
  }

  return {
    score,
    confidence: Math.max(0.18, Math.min(0.94, score / 55)),
    reasons,
  };
}

function buildSuggestionSlug(left: ComboAnalyzeDeckCard, right: ComboAnalyzeDeckCard) {
  return `synergy-${normalizeSearchText(`${left.cardName}-${right.cardName}`)}`;
}

function buildGeneratedPiece(card: ComboAnalyzeDeckCard): ComboPiece {
  return {
    role: "generated",
    familyKey: card.familyKey,
    cardName: card.cardName,
    quantity: card.quantity,
    cardId: card.cardId,
    imageUrl: card.imageUrl,
    typeLine: card.typeLine,
    text: card.text,
    domains: card.domains,
    energyCost: card.energyCost,
    power: card.power,
    might: card.might,
    hp: card.hp,
  };
}

export function buildSynergySuggestions(
  game: ComboResultSummary["game"],
  deckCards: ComboAnalyzeDeckCard[],
  hrefBuilder: (slug: string) => string,
  limit = 6,
) {
  const suggestions: ComboResultSummary[] = [];

  for (let leftIndex = 0; leftIndex < deckCards.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < deckCards.length; rightIndex += 1) {
      const left = deckCards[leftIndex];
      const right = deckCards[rightIndex];
      if (!left || !right) {
        continue;
      }

      const result = scoreComboSynergyPair(left, right);
      if (!Number.isFinite(result.score) || result.score <= 14) {
        continue;
      }

      const slug = buildSuggestionSlug(left, right);
      suggestions.push({
        id: null,
        slug,
        game,
        source: "heuristic",
        kind: "synergy",
        name: `${left.cardName} + ${right.cardName}`,
        summary: compactText(result.reasons.join(". ")) ?? "These cards look like they play well together.",
        resultText: "Deck-based synergy suggestion",
        steps: [],
        prerequisites: [],
        tags: ["Synergy"],
        formatTags: [],
        isComplete: true,
        popularity: Math.round(result.score * 10),
        pieces: [buildGeneratedPiece(left), buildGeneratedPiece(right)],
        href: hrefBuilder(slug),
        match: {
          bucket: "synergySuggestions",
          ownedPieces: [buildGeneratedPiece(left), buildGeneratedPiece(right)],
          missingPieces: [],
          ownedCount: 2,
          totalCount: 2,
          confidence: result.confidence,
          reason: result.reasons[0] ?? "These cards appear mechanically aligned.",
        },
      });
    }
  }

  return suggestions
    .sort((left, right) => {
      const leftScore = left.match?.confidence ?? 0;
      const rightScore = right.match?.confidence ?? 0;
      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      return left.name.localeCompare(right.name, undefined, {
        sensitivity: "base",
      });
    })
    .slice(0, limit);
}
