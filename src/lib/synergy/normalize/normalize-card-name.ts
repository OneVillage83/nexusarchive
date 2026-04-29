import { normalizeCardIdentityName } from "@/lib/cards/identity";

export function normalizeCardName(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return normalizeCardIdentityName(value);
}
