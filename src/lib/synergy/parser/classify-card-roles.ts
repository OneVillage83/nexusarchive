import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";

const TAG_ROLE_MAP: Partial<Record<MechanicTag, CardRole[]>> = {
  draw: ["draw"],
  search: ["search"],
  tutor: ["search"],
  ramp: ["ramp", "resource_generator"],
  resource_generation: ["resource_generator"],
  cost_reduction: ["enabler"],
  token_creation: ["enabler"],
  sacrifice: ["sacrifice_outlet", "enabler"],
  removal: ["removal"],
  damage: ["removal"],
  burn: ["finisher"],
  protection: ["protection"],
  recursion: ["payoff"],
  death_trigger: ["payoff"],
  hand_size_payoff: ["payoff"],
  graveyard_payoff: ["payoff"],
  token_payoff: ["payoff"],
  spell_payoff: ["payoff"],
  unit_payoff: ["payoff"],
  untap: ["engine_piece"],
  copy: ["combo_piece"],
  extra_attack: ["finisher"],
  extra_turn: ["finisher", "combo_piece"],
  leader_synergy: ["archetype_core"],
  tribal: ["archetype_core"],
  combo: ["combo_piece"],
};

function addRole(roles: Set<CardRole>, role: CardRole) {
  if (role !== "unknown") {
    roles.add(role);
  }
}

export function classifyCardRoles(tags: MechanicTag[], seedRoles: CardRole[] = []) {
  const roles = new Set<CardRole>();

  for (const role of seedRoles) {
    addRole(roles, role);
  }

  for (const tag of tags) {
    for (const role of TAG_ROLE_MAP[tag] ?? []) {
      addRole(roles, role);
    }
  }

  const hasEngineInputs =
    tags.includes("token_creation") ||
    tags.includes("resource_generation") ||
    tags.includes("discard") ||
    tags.includes("sacrifice");
  const hasEnginePayoffs =
    tags.includes("death_trigger") ||
    tags.includes("graveyard_payoff") ||
    tags.includes("token_payoff") ||
    tags.includes("hand_size_payoff");

  if (hasEngineInputs && hasEnginePayoffs) {
    roles.add("engine_piece");
  }

  if (roles.size === 0) {
    roles.add("unknown");
  }

  return [...roles];
}
