import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import {
  SYNERGY_EDGE_RULES,
  type SynergyEdgeRule,
} from "@/lib/synergy/constants/synergy-types";
import { scoreSynergyEdge } from "@/lib/synergy/scoring/score-synergy-edge";
import type {
  SynergyEdgeProfile,
  SynergyEdgeResult,
} from "@/lib/synergy/types/synergy-edge";

import { explainSynergyEdge } from "./explain-synergy-edge";

export const DEFAULT_SYNERGY_EDGE_MIN_SCORE = 60;
export const DEFAULT_MAX_EDGES_PER_PRIMARY = 20;

export type FindSynergyEdgesInput = {
  profiles: SynergyEdgeProfile[];
  minScore?: number;
  maxEdgesPerPrimary?: number;
};

function addToIndex<T extends string>(
  index: Map<T, SynergyEdgeProfile[]>,
  key: T,
  profile: SynergyEdgeProfile,
) {
  const entries = index.get(key) ?? [];
  entries.push(profile);
  index.set(key, entries);
}

function buildProfileIndexes(profiles: SynergyEdgeProfile[]) {
  const byTag = new Map<MechanicTag, SynergyEdgeProfile[]>();
  const byRole = new Map<CardRole, SynergyEdgeProfile[]>();

  for (const profile of profiles) {
    for (const tag of profile.tags) {
      addToIndex(byTag, tag, profile);
    }

    for (const role of profile.roles) {
      addToIndex(byRole, role, profile);
    }
  }

  return { byTag, byRole };
}

function profileMatchesProducer(
  profile: SynergyEdgeProfile,
  rule: SynergyEdgeRule,
) {
  if (rule.producerTag && !profile.tags.includes(rule.producerTag)) {
    return false;
  }

  if (rule.producerRole && !profile.roles.includes(rule.producerRole)) {
    return false;
  }

  return Boolean(rule.producerTag || rule.producerRole);
}

function profileMatchesConsumer(
  profile: SynergyEdgeProfile,
  rule: SynergyEdgeRule,
) {
  if (rule.consumerTag && !profile.tags.includes(rule.consumerTag)) {
    return false;
  }

  if (rule.consumerRole && !profile.roles.includes(rule.consumerRole)) {
    return false;
  }

  return Boolean(rule.consumerTag || rule.consumerRole);
}

function getConsumerCandidates(
  rule: SynergyEdgeRule,
  indexes: ReturnType<typeof buildProfileIndexes>,
) {
  const candidates = new Set<SynergyEdgeProfile>();

  if (rule.consumerTag) {
    for (const profile of indexes.byTag.get(rule.consumerTag) ?? []) {
      candidates.add(profile);
    }
  }

  if (rule.consumerRole) {
    for (const profile of indexes.byRole.get(rule.consumerRole) ?? []) {
      candidates.add(profile);
    }
  }

  return [...candidates].filter((profile) =>
    profileMatchesConsumer(profile, rule),
  );
}

function mergeRuleTags(primary: SynergyEdgeProfile, secondary: SynergyEdgeProfile, rule: SynergyEdgeRule) {
  return [
    ...new Set([
      ...(rule.tags ?? []),
      ...primary.tags.filter((tag) => tag !== "unknown"),
      ...secondary.tags.filter((tag) => tag !== "unknown"),
    ]),
  ];
}

function mergeRuleRoles(primary: SynergyEdgeProfile, secondary: SynergyEdgeProfile, rule: SynergyEdgeRule) {
  return [
    ...new Set([
      ...(rule.roles ?? []),
      ...primary.roles.filter((role) => role !== "unknown"),
      ...secondary.roles.filter((role) => role !== "unknown"),
    ]),
  ];
}

function buildEdge(
  primary: SynergyEdgeProfile,
  secondary: SynergyEdgeProfile,
  rule: SynergyEdgeRule,
): SynergyEdgeResult {
  const score = scoreSynergyEdge({ rule, primary, secondary });
  const explanation = explainSynergyEdge({ rule, primary, secondary });

  return {
    game: primary.game,
    source: primary.source,
    cardIds: [primary.id, secondary.id],
    identityKeys: [primary.identityKey, secondary.identityKey],
    primaryCardId: primary.id,
    secondaryCardId: secondary.id,
    primaryIdentityKey: primary.identityKey,
    secondaryIdentityKey: secondary.identityKey,
    primaryName: primary.name,
    secondaryName: secondary.name,
    synergyType: rule.type,
    score,
    tags: mergeRuleTags(primary, secondary, rule),
    roles: mergeRuleRoles(primary, secondary, rule),
    ...explanation,
  };
}

export function findSynergyEdges(input: FindSynergyEdgesInput) {
  const minScore = input.minScore ?? DEFAULT_SYNERGY_EDGE_MIN_SCORE;
  const maxEdgesPerPrimary =
    input.maxEdgesPerPrimary ?? DEFAULT_MAX_EDGES_PER_PRIMARY;
  const indexes = buildProfileIndexes(input.profiles);
  const byPrimary = new Map<string, SynergyEdgeResult[]>();

  for (const primary of input.profiles) {
    const candidateEdges = new Map<string, SynergyEdgeResult>();

    for (const rule of SYNERGY_EDGE_RULES) {
      if (!profileMatchesProducer(primary, rule)) {
        continue;
      }

      for (const secondary of getConsumerCandidates(rule, indexes)) {
        if (primary.identityKey === secondary.identityKey) {
          continue;
        }

        const edge = buildEdge(primary, secondary, rule);
        if (edge.score < minScore) {
          continue;
        }

        const dedupeKey = [
          edge.primaryIdentityKey,
          edge.secondaryIdentityKey,
          edge.synergyType,
        ].join("|");
        const existing = candidateEdges.get(dedupeKey);
        if (!existing || edge.score > existing.score) {
          candidateEdges.set(dedupeKey, edge);
        }
      }
    }

    const limitedEdges = [...candidateEdges.values()]
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.secondaryName.localeCompare(right.secondaryName),
      )
      .slice(0, maxEdgesPerPrimary);

    if (limitedEdges.length > 0) {
      byPrimary.set(primary.identityKey, limitedEdges);
    }
  }

  return [...byPrimary.values()].flat();
}
