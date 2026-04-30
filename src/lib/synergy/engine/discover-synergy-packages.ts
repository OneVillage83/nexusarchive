import { createHash } from "node:crypto";

import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import { explainSynergyPackage } from "@/lib/synergy/engine/explain-synergy-package";
import { inferSynergyPackageTypes } from "@/lib/synergy/engine/infer-synergy-package";
import { scoreSynergyPackage } from "@/lib/synergy/scoring/score-synergy-package";
import type {
  SynergyPackageCandidate,
  SynergyPackageEdge,
  SynergyPackageResult,
} from "@/lib/synergy/types/synergy-package";

export const DEFAULT_PACKAGE_MIN_EDGE_SCORE = 60;
export const DEFAULT_PACKAGE_MIN_SCORE = 65;
export const DEFAULT_MAX_PACKAGE_SIZE = 5;
export const DEFAULT_MAX_PACKAGES = 5000;

export type DiscoverSynergyPackagesInput = {
  edges: SynergyPackageEdge[];
  minEdgeScore?: number;
  minPackageScore?: number;
  maxPackageSize?: number;
  maxPackages?: number;
};

function pairKey(left: string, right: string) {
  return [left, right].sort().join("|");
}

function packageKey(identityKeys: string[]) {
  return createHash("sha256").update([...identityKeys].sort().join("|")).digest("hex");
}

function edgeKey(edge: SynergyPackageEdge) {
  return (
    edge.id ??
    [
      edge.primaryIdentityKey,
      edge.secondaryIdentityKey,
      edge.synergyType,
    ].join("|")
  );
}

function addUnique<T>(values: Set<T>, items: readonly T[]) {
  for (const item of items) {
    values.add(item);
  }
}

function buildGraph(edges: SynergyPackageEdge[]) {
  const adjacency = new Map<string, Set<string>>();
  const cardIdByIdentity = new Map<string, string>();
  const edgesByPair = new Map<string, SynergyPackageEdge[]>();

  for (const edge of edges) {
    const [left, right] = edge.identityKeys;
    if (!left || !right || left === right) {
      continue;
    }

    cardIdByIdentity.set(left, edge.cardIds[0] ?? left);
    cardIdByIdentity.set(right, edge.cardIds[1] ?? right);

    const leftNeighbors = adjacency.get(left) ?? new Set<string>();
    leftNeighbors.add(right);
    adjacency.set(left, leftNeighbors);

    const rightNeighbors = adjacency.get(right) ?? new Set<string>();
    rightNeighbors.add(left);
    adjacency.set(right, rightNeighbors);

    const key = pairKey(left, right);
    const pairEdges = edgesByPair.get(key) ?? [];
    pairEdges.push(edge);
    edgesByPair.set(key, pairEdges);
  }

  return { adjacency, cardIdByIdentity, edgesByPair };
}

function getInternalEdges(
  identityKeys: string[],
  edgesByPair: Map<string, SynergyPackageEdge[]>,
) {
  const identitySet = new Set(identityKeys);
  const internalEdges: SynergyPackageEdge[] = [];

  for (let leftIndex = 0; leftIndex < identityKeys.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < identityKeys.length; rightIndex += 1) {
      const left = identityKeys[leftIndex]!;
      const right = identityKeys[rightIndex]!;
      if (!identitySet.has(left) || !identitySet.has(right)) {
        continue;
      }

      internalEdges.push(...(edgesByPair.get(pairKey(left, right)) ?? []));
    }
  }

  return internalEdges;
}

function enumerateConnectedSets(input: {
  adjacency: Map<string, Set<string>>;
  maxPackageSize: number;
  maxCandidateSets: number;
}) {
  const identities = [...input.adjacency.keys()].sort();
  const candidates = new Map<string, string[]>();

  function visit(root: string, current: Set<string>) {
    if (candidates.size >= input.maxCandidateSets) {
      return;
    }

    const sortedCurrent = [...current].sort();
    if (sortedCurrent[0] !== root) {
      return;
    }

    if (sortedCurrent.length >= 3) {
      candidates.set(sortedCurrent.join("|"), sortedCurrent);
    }

    if (sortedCurrent.length >= input.maxPackageSize) {
      return;
    }

    const nextNeighbors = new Set<string>();
    for (const identity of sortedCurrent) {
      for (const neighbor of input.adjacency.get(identity) ?? []) {
        if (!current.has(neighbor)) {
          nextNeighbors.add(neighbor);
        }
      }
    }

    for (const neighbor of [...nextNeighbors].sort()) {
      const next = new Set(current);
      next.add(neighbor);
      visit(root, next);
    }
  }

  for (const identity of identities) {
    visit(identity, new Set([identity]));
    if (candidates.size >= input.maxCandidateSets) {
      break;
    }
  }

  return [...candidates.values()];
}

function buildCandidate(input: {
  identityKeys: string[];
  cardIdByIdentity: Map<string, string>;
  internalEdges: SynergyPackageEdge[];
}): SynergyPackageCandidate {
  const tagSet = new Set<MechanicTag>();
  const roleSet = new Set<CardRole>();
  const firstEdge = input.internalEdges[0]!;

  for (const edge of input.internalEdges) {
    addUnique(tagSet, edge.tags);
    addUnique(roleSet, edge.roles);
  }

  return {
    game: firstEdge.game,
    source: firstEdge.source,
    identityKeys: input.identityKeys,
    cardIds: input.identityKeys.map(
      (identityKey) => input.cardIdByIdentity.get(identityKey) ?? identityKey,
    ),
    internalEdges: input.internalEdges,
    tags: [...tagSet],
    roles: [...roleSet],
  };
}

function buildPackageResults(input: {
  candidate: SynergyPackageCandidate;
  minPackageScore: number;
}) {
  const results: SynergyPackageResult[] = [];
  const inferredTypes = inferSynergyPackageTypes(input.candidate);

  for (const inference of inferredTypes) {
    const score = scoreSynergyPackage({
      candidate: input.candidate,
      inference,
    });
    if (score < input.minPackageScore) {
      continue;
    }

    const explanation = explainSynergyPackage({
      candidate: input.candidate,
      inference,
    });

    results.push({
      game: input.candidate.game,
      source: input.candidate.source,
      packageKey: packageKey(input.candidate.identityKeys),
      cardIds: input.candidate.cardIds,
      identityKeys: input.candidate.identityKeys,
      packageSize: input.candidate.identityKeys.length,
      packageType: inference.type,
      score,
      tags: input.candidate.tags,
      roles: input.candidate.roles,
      requiredEdges: input.candidate.internalEdges.map(edgeKey),
      ...explanation,
      isCombo: Boolean(inference.rule.isCombo),
      isEngine: Boolean(inference.rule.isEngine),
      isWinCondition:
        Boolean(inference.rule.isWinCondition) ||
        (input.candidate.roles.includes("finisher") &&
          input.candidate.roles.includes("payoff")),
    });
  }

  return results;
}

export function discoverSynergyPackages(input: DiscoverSynergyPackagesInput) {
  const minEdgeScore = input.minEdgeScore ?? DEFAULT_PACKAGE_MIN_EDGE_SCORE;
  const minPackageScore = input.minPackageScore ?? DEFAULT_PACKAGE_MIN_SCORE;
  const maxPackageSize = Math.min(
    DEFAULT_MAX_PACKAGE_SIZE,
    Math.max(3, input.maxPackageSize ?? DEFAULT_MAX_PACKAGE_SIZE),
  );
  const maxPackages = input.maxPackages ?? DEFAULT_MAX_PACKAGES;
  const eligibleEdges = input.edges.filter((edge) => edge.score >= minEdgeScore);
  const { adjacency, cardIdByIdentity, edgesByPair } = buildGraph(eligibleEdges);
  const candidateSets = enumerateConnectedSets({
    adjacency,
    maxPackageSize,
    maxCandidateSets: Math.max(maxPackages * 8, maxPackages),
  });
  const byPackage = new Map<string, SynergyPackageResult>();

  for (const identityKeys of candidateSets) {
    const internalEdges = getInternalEdges(identityKeys, edgesByPair);
    if (internalEdges.length < identityKeys.length - 1) {
      continue;
    }

    const candidate = buildCandidate({
      identityKeys,
      cardIdByIdentity,
      internalEdges,
    });

    for (const result of buildPackageResults({ candidate, minPackageScore })) {
      const dedupeKey = [result.packageKey, result.packageType].join("|");
      const existing = byPackage.get(dedupeKey);
      if (!existing || result.score > existing.score) {
        byPackage.set(dedupeKey, result);
      }
    }
  }

  return [...byPackage.values()]
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.packageSize - right.packageSize ||
        left.packageType.localeCompare(right.packageType),
    )
    .slice(0, maxPackages);
}
