import assert from "node:assert/strict";
import test from "node:test";

import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import { inferSynergyPackageTypes } from "@/lib/synergy/engine/infer-synergy-package";
import type { SynergyPackageCandidate } from "@/lib/synergy/types/synergy-package";

function candidate(input: {
  tags: MechanicTag[];
  roles?: CardRole[];
}): Pick<SynergyPackageCandidate, "tags" | "roles" | "internalEdges"> {
  return {
    tags: input.tags,
    roles: input.roles ?? [],
    internalEdges: [],
  };
}

test("inferSynergyPackageTypes detects token packages", () => {
  const [result] = inferSynergyPackageTypes(
    candidate({
      tags: ["token_creation", "token_payoff", "wide_board"],
      roles: ["enabler", "payoff"],
    }),
  );

  assert.equal(result?.type, "token_package");
});

test("inferSynergyPackageTypes detects sacrifice packages", () => {
  const [result] = inferSynergyPackageTypes(
    candidate({
      tags: ["token_creation", "sacrifice", "death_trigger"],
      roles: ["sacrifice_outlet", "payoff"],
    }),
  );

  assert.equal(result?.type, "sacrifice_package");
});

test("inferSynergyPackageTypes detects graveyard packages", () => {
  const [result] = inferSynergyPackageTypes(
    candidate({
      tags: ["discard", "graveyard_payoff", "recursion"],
      roles: ["enabler", "payoff"],
    }),
  );

  assert.equal(result?.type, "graveyard_package");
});

test("inferSynergyPackageTypes detects resource packages", () => {
  const [result] = inferSynergyPackageTypes(
    candidate({
      tags: ["resource_generation", "resource_conversion", "draw"],
      roles: ["resource_generator", "resource_sink"],
    }),
  );

  assert.equal(result?.type, "resource_package");
});

test("inferSynergyPackageTypes detects control packages", () => {
  const [result] = inferSynergyPackageTypes(
    candidate({
      tags: ["removal", "draw", "protection", "control"],
      roles: ["removal", "draw", "protection"],
    }),
  );

  assert.equal(result?.type, "control_package");
});

test("inferSynergyPackageTypes detects combo setup packages", () => {
  const [result] = inferSynergyPackageTypes(
    candidate({
      tags: ["combo", "search", "protection"],
      roles: ["combo_piece", "search", "protection"],
    }),
  );

  assert.equal(result?.type, "combo_setup_package");
});
