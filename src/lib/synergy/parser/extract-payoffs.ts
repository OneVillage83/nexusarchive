import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import type { PayoffProfile } from "@/lib/synergy/types/card-profile";

export function extractPayoffs(tags: MechanicTag[]) {
  const payoffs: PayoffProfile[] = [];

  if (tags.includes("death_trigger")) {
    payoffs.push({
      condition: "a unit, creature, or character dies",
      reward: "death-trigger value",
      tags: ["death_trigger"],
    });
  }

  if (tags.includes("token_payoff")) {
    payoffs.push({
      condition: "tokens are created or present",
      reward: "token payoff",
      tags: ["token_payoff"],
    });
  }

  if (tags.includes("graveyard_payoff")) {
    payoffs.push({
      condition: "cards are in the graveyard, trash, or discard pile",
      reward: "graveyard payoff",
      tags: ["graveyard_payoff"],
    });
  }

  if (tags.includes("hand_size_payoff")) {
    payoffs.push({
      condition: "hand size reaches the referenced threshold",
      reward: "hand-size payoff",
      tags: ["hand_size_payoff"],
    });
  }

  if (tags.includes("spell_payoff")) {
    payoffs.push({
      condition: "spells are cast",
      reward: "spell payoff",
      tags: ["spell_payoff"],
    });
  }

  if (tags.includes("unit_payoff")) {
    payoffs.push({
      condition: "units, creatures, or characters enter or are present",
      reward: "unit payoff",
      tags: ["unit_payoff"],
    });
  }

  if (tags.includes("life_payoff")) {
    payoffs.push({
      condition: "life is gained or paid",
      reward: "life payoff",
      tags: ["life_payoff"],
    });
  }

  return payoffs;
}
