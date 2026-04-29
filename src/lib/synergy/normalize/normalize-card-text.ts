export function normalizeCardText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeRulesText(value: string | null | undefined) {
  return normalizeCardText(value).toLowerCase();
}
