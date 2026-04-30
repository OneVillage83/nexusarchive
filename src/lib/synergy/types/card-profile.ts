import type { Game } from "@prisma/client";

import type { GameSlug } from "@/lib/games";
import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";

export type TriggerProfile = {
  event: string;
  condition?: string;
  frequency?: "once" | "repeatable" | "static" | "unknown";
};

export type ResourceProfile = {
  resource: string;
  amount?: number | "variable" | "unknown";
  condition?: string;
};

export type PayoffProfile = {
  condition: string;
  reward: string;
  tags: MechanicTag[];
};

export type ConstraintProfile = {
  type?: string[];
  color?: string[];
  trait?: string[];
  timing?: string[];
  archetype?: string[];
  gameSpecific?: Record<string, unknown>;
};

export type CardIntelligenceProfile = {
  cardId: number;
  game: Game;
  name: string;
  tags: MechanicTag[];
  roles: CardRole[];
  triggers: TriggerProfile[];
  produces: ResourceProfile[];
  consumes: ResourceProfile[];
  payoffs: PayoffProfile[];
  constraints: ConstraintProfile[];
  risks: string[];
  parserVersion: string;
  confidence: number;
};

export type ParsedCardMechanics = Omit<
  CardIntelligenceProfile,
  "cardId" | "game" | "name"
>;

export type CatalogCardIntelligenceProfile = ParsedCardMechanics & {
  catalogCardId: string;
  game: GameSlug;
  name: string;
  source: string;
  familyKey?: string | null;
};

export type CardProfileInput = {
  cardId: number;
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

export type CardMechanicsInput = Omit<
  CardProfileInput,
  "cardId" | "game"
>;
