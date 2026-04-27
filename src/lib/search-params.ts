export type SearchParamsInput = Record<
  string,
  string | string[] | undefined
>;

export function createSearchString(searchParams?: SearchParamsInput): string {
  if (!searchParams) {
    return "";
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "undefined") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.set(key, value);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
