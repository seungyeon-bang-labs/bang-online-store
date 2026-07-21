export function parseQueryOption<T extends string>({
  value,
  options,
  fallback,
}: {
  value?: string;
  options: readonly T[];
  fallback: T;
}): T {
  if (value && options.includes(value as T)) {
    return value as T;
  }

  return fallback;
}

export type QueryParamValue = string | number | null | undefined;
export type QueryParamRecord = Record<string, QueryParamValue>;

export function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePositivePage(
  value: string | string[] | undefined,
): number {
  const parsed = Number(firstQueryValue(value));
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function buildQueryHref(
  pathname: string,
  params: QueryParamRecord,
): string {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? pathname + '?' + query : pathname;
}
