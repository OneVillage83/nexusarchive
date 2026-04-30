import type { GameSlug } from "@/lib/games";
import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import type { SynergyPackageType } from "@/lib/synergy/constants/package-types";
import type { SynergyEdgeType } from "@/lib/synergy/constants/synergy-types";
import type { SynergyEdgeSource } from "@/lib/synergy/types/synergy-edge";

export type SynergyPackageEdge = {
  id?: string;
  game: GameSlug;
  source: SynergyEdgeSource;
  cardIds: string[];
  identityKeys: string[];
  primaryCardId: string;
  secondaryCardId: string;
  primaryIdentityKey: string;
  secondaryIdentityKey: string;
  synergyType: SynergyEdgeType;
  score: number;
  tags: MechanicTag[];
  roles: CardRole[];
  explanation: string;
  requiredConditions: string[];
  weaknesses: string[];
};

export type SynergyPackageResult = {
  game: GameSlug;
  source: SynergyEdgeSource;
  packageKey: string;
  cardIds: string[];
  identityKeys: string[];
  packageSize: number;
  packageType: SynergyPackageType;
  score: number;
  tags: MechanicTag[];
  roles: CardRole[];
  requiredEdges: string[];
  explanation: string;
  playPattern: string;
  requiredConditions: string[];
  weaknesses: string[];
  isCombo: boolean;
  isEngine: boolean;
  isWinCondition: boolean;
};

export type SynergyPackageCandidate = {
  game: GameSlug;
  source: SynergyEdgeSource;
  identityKeys: string[];
  cardIds: string[];
  internalEdges: SynergyPackageEdge[];
  tags: MechanicTag[];
  roles: CardRole[];
};
