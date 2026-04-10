import type { CardCatalogSummary } from "@/lib/cards/catalog";
import { compactText, normalizeSearchText } from "@/lib/cards/catalog";

const VARIANT_KEYWORDS = [
  "alternate art",
  "alt art",
  "parallel",
  "showcase",
  "borderless",
  "textured",
  "textured foil",
  "foil",
  "etched",
  "etched foil",
  "extended art",
  "full art",
  "serialized",
  "promo",
  "stamped",
  "judge",
  "manga",
  "secret",
  "special art",
  "showcase frame",
  "expedition",
  "masterpiece",
  "surge foil",
  "collector booster",
];

const SPECIAL_RARITY_KEYWORDS = [
  "promo",
  "parallel",
  "showcase",
  "serialized",
  "foil",
  "etched",
  "manga",
  "secret",
  "textured",
  "stamped",
  "judge",
  "borderless",
  "extended",
  "full art",
  "alternate art",
  "alt art",
];

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isVariantDescriptor(value: string) {
  const normalized = normalizeSearchText(value);
  if (!normalized) {
    return false;
  }

  return VARIANT_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function removeTrailingParentheticalVariant(name: string) {
  let working = cleanWhitespace(name);

  while (true) {
    const match = working.match(/\s*\(([^)]+)\)\s*$/);
    if (!match || !match[1] || !isVariantDescriptor(match[1])) {
      return working;
    }

    working = cleanWhitespace(working.slice(0, match.index));
  }
}

export function getCardBaseName(name: string) {
  const withoutTrailingVariant = removeTrailingParentheticalVariant(name);
  const normalized = cleanWhitespace(withoutTrailingVariant);

  return normalized || cleanWhitespace(name);
}

export function normalizeCardIdentityName(name: string) {
  return normalizeSearchText(getCardBaseName(name));
}

export function getVariantNameSuffix(name: string) {
  const normalized = cleanWhitespace(name);
  const base = getCardBaseName(normalized);

  if (normalized === base) {
    return null;
  }

  const suffix = compactText(normalized.slice(base.length));
  if (!suffix) {
    return null;
  }

  return suffix.replace(/^[-–—:]\s*/, "");
}

export function isLikelyBaseVersion(
  card: Pick<CardCatalogSummary, "name" | "rarity" | "setName" | "setCode">,
) {
  const variantSuffix = getVariantNameSuffix(card.name);
  if (variantSuffix) {
    return false;
  }

  const rarity = normalizeSearchText(card.rarity ?? "");
  const setLabel = normalizeSearchText(card.setName ?? card.setCode ?? "");

  return !SPECIAL_RARITY_KEYWORDS.some(
    (keyword) => rarity.includes(keyword) || setLabel.includes(keyword),
  );
}

export function getCardVersionLabel(
  card: Pick<CardCatalogSummary, "name" | "rarity" | "setName" | "setCode">,
) {
  const suffix = getVariantNameSuffix(card.name);
  if (suffix) {
    return suffix
      .replace(/[()]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (!isLikelyBaseVersion(card)) {
    const rarity = compactText(card.rarity);
    if (rarity) {
      return toTitleCase(rarity);
    }
  }

  return "Base printing";
}
