import type { CardCatalogSummary } from "@/lib/cards/catalog";
import type { GameSlug } from "@/lib/games";

export const NEXUSARCHIVE_CARD_DRAG_MIME = "application/x-nexusarchive-card";
const NEXUSARCHIVE_CARD_DRAG_STORAGE_KEY = "nexusarchive:drag-card";
const MAX_DRAG_PAYLOAD_AGE_MS = 1000 * 60 * 10;

export type DraggedCardPayload = {
  game: GameSlug;
  id: string;
  familyKey?: string;
  name: string;
  imageUrl: string | null;
  type: string | null;
  text: string | null;
  domains: string[];
  energyCost: number | null;
  power: number | null;
  might: number | null;
  hp: number | null;
  setCode: string | null;
  setName: string | null;
  rarity: string | null;
  versionLabel?: string | null;
};

type StoredDraggedCardPayload = {
  payload: DraggedCardPayload;
  writtenAt: number;
};

export function buildDraggedCardPayload(card: CardCatalogSummary): DraggedCardPayload {
  return {
    game: card.game,
    id: card.id,
    familyKey: card.familyKey,
    name: card.name,
    imageUrl: card.imageUrl,
    type: card.type,
    text: card.text,
    domains: card.domains,
    energyCost: card.energyCost,
    power: card.power,
    might: card.might,
    hp: card.hp,
    setCode: card.setCode,
    setName: card.setName,
    rarity: card.rarity,
    versionLabel: card.versionLabel ?? null,
  };
}

export function payloadToCardSummary(payload: DraggedCardPayload): CardCatalogSummary {
  return {
    id: payload.id,
    game: payload.game,
    name: payload.name,
    familyKey: payload.familyKey,
    type: payload.type,
    domains: payload.domains,
    tags: [],
    energyCost: payload.energyCost,
    power: payload.power,
    might: payload.might,
    hp: payload.hp,
    rarity: payload.rarity,
    text: payload.text,
    flavor: null,
    setCode: payload.setCode,
    setName: payload.setName,
    collectorNo: null,
    imageUrl: payload.imageUrl,
    artist: null,
    marketPrice: null,
    source: payload.game === "one-piece"
      ? "optcgapi-all-set-cards"
      : payload.game === "magic-the-gathering"
        ? "scryfall-default-cards"
        : "riftcodex-cards",
    externalUrl: null,
    searchText: "",
    versionLabel: payload.versionLabel ?? null,
  };
}

export function writeDraggedCardPayload(payload: DraggedCardPayload) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const value: StoredDraggedCardPayload = {
      payload,
      writtenAt: Date.now(),
    };
    window.localStorage.setItem(
      NEXUSARCHIVE_CARD_DRAG_STORAGE_KEY,
      JSON.stringify(value),
    );
  } catch {
    // Ignore storage failures. dataTransfer is still the primary path.
  }
}

export function readDraggedCardPayloadFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(NEXUSARCHIVE_CARD_DRAG_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredDraggedCardPayload;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.payload ||
      typeof parsed.writtenAt !== "number"
    ) {
      return null;
    }

    if (Date.now() - parsed.writtenAt > MAX_DRAG_PAYLOAD_AGE_MS) {
      return null;
    }

    return parsed.payload;
  } catch {
    return null;
  }
}

export function extractDraggedCardPayload(
  dataTransfer: DataTransfer | null | undefined,
) {
  if (dataTransfer) {
    const direct = dataTransfer.getData(NEXUSARCHIVE_CARD_DRAG_MIME);
    if (direct) {
      try {
        return JSON.parse(direct) as DraggedCardPayload;
      } catch {
        // Fall through to storage fallback.
      }
    }
  }

  return readDraggedCardPayloadFromStorage();
}

export function attachDraggedCardPayload(
  dataTransfer: DataTransfer,
  payload: DraggedCardPayload,
) {
  const serialized = JSON.stringify(payload);
  dataTransfer.setData(NEXUSARCHIVE_CARD_DRAG_MIME, serialized);
  dataTransfer.setData("text/plain", payload.name);
  dataTransfer.effectAllowed = "copy";
  writeDraggedCardPayload(payload);
}
