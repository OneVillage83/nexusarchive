import type { Game } from "@prisma/client";

import type { GameSlug } from "@/lib/games";
import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import type { SynergyEdgeType } from "@/lib/synergy/constants/synergy-types";
import type {
  ConstraintProfile,
  PayoffProfile,
  ResourceProfile,
  TriggerProfile,
} from "@/lib/synergy/types/card-profile";

export const SYNERGY_EDGE_SOURCES = ["catalog", "prisma"] as const;

export type SynergyEdgeSource = (typeof SYNERGY_EDGE_SOURCES)[number];

export type SynergyEdgeProfile = {
  id: string;
  identityKey: string;
  source: SynergyEdgeSource;
  game: GameSlug;
  prismaGame: Game;
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

export type SynergyEdgeResult = {
  game: GameSlug;
  source: SynergyEdgeSource;
  cardIds: string[];
  identityKeys: string[];
  primaryCardId: string;
  secondaryCardId: string;
  primaryIdentityKey: string;
  secondaryIdentityKey: string;
  primaryName: string;
  secondaryName: string;
  synergyType: SynergyEdgeType;
  score: number;
  tags: MechanicTag[];
  roles: CardRole[];
  explanation: string;
  requiredConditions: string[];
  weaknesses: string[];
};
