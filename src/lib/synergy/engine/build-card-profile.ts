import type { Game } from "@prisma/client";

import type { CardCatalogSummary } from "@/lib/cards/catalog";
import {
  parseCardMechanics,
  parseCardProfile,
} from "@/lib/synergy/parser/parse-card-profile";
import type {
  CatalogCardIntelligenceProfile,
  CardIntelligenceProfile,
  CardProfileInput,
} from "@/lib/synergy/types/card-profile";

export type CardProfileSourceCard = {
  id: number;
  game: Game;
  name: string;
  type: string | null;
  domains: string[];
  text: string | null;
  energyCost?: number | null;
  power?: number | null;
  might?: number | null;
  hp?: number | null;
};

function toProfileInput(card: CardProfileSourceCard): CardProfileInput {
  return {
    cardId: card.id,
    game: card.game,
    name: card.name,
    type: card.type,
    domains: card.domains,
    text: card.text,
    energyCost: card.energyCost ?? null,
    power: card.power ?? null,
    might: card.might ?? null,
    hp: card.hp ?? null,
  };
}

export function buildCardProfile(card: CardProfileSourceCard): CardIntelligenceProfile {
  return parseCardProfile(toProfileInput(card));
}

export function buildCatalogCardProfile(
  card: CardCatalogSummary,
): CatalogCardIntelligenceProfile {
  return {
    catalogCardId: card.id,
    game: card.game,
    name: card.name,
    source: card.source,
    familyKey: card.familyKey ?? null,
    ...parseCardMechanics({
      name: card.name,
      type: card.type,
      domains: card.domains,
      text: card.text,
      energyCost: card.energyCost,
      power: card.power,
      might: card.might,
      hp: card.hp,
    }),
  };
}
