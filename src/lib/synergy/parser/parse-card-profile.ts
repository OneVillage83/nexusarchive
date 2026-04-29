import { SYNERGY_PARSER_VERSION } from "@/lib/synergy/constants/game-config";
import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import { normalizeRulesText } from "@/lib/synergy/normalize/normalize-card-text";
import type {
  CardMechanicsInput,
  CardIntelligenceProfile,
  CardProfileInput,
  ConstraintProfile,
  ParsedCardMechanics,
} from "@/lib/synergy/types/card-profile";

import { classifyCardRoles } from "./classify-card-roles";
import {
  isLowProfileConfidence,
  scoreProfileConfidence,
} from "./confidence";
import { extractPayoffs } from "./extract-payoffs";
import {
  extractConsumedResources,
  extractProducedResources,
} from "./extract-resources";
import { extractTriggers } from "./extract-triggers";
import { MECHANIC_RULES } from "./rule-patterns";

function addUnique<T>(values: Set<T>, items: readonly T[] | undefined) {
  for (const item of items ?? []) {
    values.add(item);
  }
}

function buildConstraints(card: CardMechanicsInput): ConstraintProfile[] {
  const gameSpecific = {
    domains: card.domains,
    energyCost: card.energyCost ?? null,
    power: card.power ?? null,
    might: card.might ?? null,
    hp: card.hp ?? null,
  };

  const constraint: ConstraintProfile = { gameSpecific };

  if (card.type) {
    constraint.type = [card.type];
  }

  return [constraint];
}

function detectTimingConstraints(normalizedText: string) {
  const timing: string[] = [];

  if (/\bonce\s+(?:per|each)\s+turn\b/.test(normalizedText)) {
    timing.push("once_per_turn");
  }

  if (/\bthis\s+turn\b/.test(normalizedText)) {
    timing.push("this_turn");
  }

  return timing;
}

export function parseCardMechanics(card: CardMechanicsInput): ParsedCardMechanics {
  const normalizedText = normalizeRulesText(card.text);
  const tags = new Set<MechanicTag>();
  const seedRoles = new Set<CardRole>();

  for (const rule of MECHANIC_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalizedText))) {
      tags.add(rule.tag);
      addUnique(seedRoles, rule.roles);
    }
  }

  if (tags.size === 0) {
    tags.add("unknown");
  }

  const tagList = [...tags];
  const roles = classifyCardRoles(tagList, [...seedRoles]);
  const triggers = extractTriggers(normalizedText, tagList);
  const produces = extractProducedResources(normalizedText, tagList);
  const consumes = extractConsumedResources(normalizedText, tagList);
  const payoffs = extractPayoffs(tagList);
  const constraints = buildConstraints(card).map((constraint) => {
    const timing = detectTimingConstraints(normalizedText);
    return timing.length > 0 ? { ...constraint, timing } : constraint;
  });
  const confidence = scoreProfileConfidence({
    normalizedText,
    tags: tagList,
    roles,
    triggers,
    produces,
    consumes,
    payoffs,
  });
  const risks: string[] = [];

  if (!normalizedText) {
    risks.push("empty_rules_text");
  }

  if (tagList.includes("unknown")) {
    risks.push("no_mechanics_detected");
  }

  if (isLowProfileConfidence(confidence)) {
    risks.push("low_parser_confidence");
  }

  return {
    tags: tagList,
    roles,
    triggers,
    produces,
    consumes,
    payoffs,
    constraints,
    risks,
    parserVersion: SYNERGY_PARSER_VERSION,
    confidence,
  };
}

export function parseCardProfile(card: CardProfileInput): CardIntelligenceProfile {
  return {
    cardId: card.cardId,
    game: card.game,
    name: card.name,
    ...parseCardMechanics(card),
  };
}
