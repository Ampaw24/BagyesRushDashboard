import { DEFAULT_PER_PAGE, MAX_PER_PAGE, MIN_PER_PAGE } from "./config";

/** The shape Next hands a page as `searchParams` (already awaited). */
export type SearchParams = Record<string, string | string[] | undefined>;

export type QueryValue = string | number | boolean | null | undefined;

/**
 * Builds a query string, dropping anything the backend would reject or ignore.
 * Booleans go out as 1/0 because Laravel's `boolean` rule accepts those but not
 * the strings "true"/"false" from a bare `String(value)`.
 */
export function toQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "boolean") {
      search.set(key, value ? "1" : "0");
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Reads a single value, ignoring the array form Next produces for repeated keys. */
export function readParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single === "" ? undefined : single;
}

/** Reads a param only if it is one of the values the backend's `in:` rule allows. */
export function readEnumParam<T extends string>(
  params: SearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = readParam(params, key);
  return value !== undefined && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Reads a "1"/"0" style filter into a boolean the backend accepts. */
export function readBooleanParam(params: SearchParams, key: string): boolean | undefined {
  const value = readParam(params, key);
  if (value === undefined) return undefined;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return undefined;
}

export function readNumberParam(params: SearchParams, key: string): number | undefined {
  const value = readParam(params, key);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function clampPerPage(value: number | undefined, fallback = DEFAULT_PER_PAGE): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(MAX_PER_PAGE, Math.max(MIN_PER_PAGE, Math.trunc(value)));
}

export type ListParams = {
  page: number;
  per_page: number;
  search?: string;
};

/**
 * The pagination/search trio every admin list endpoint accepts. Module-specific
 * filters are read on top of this with the `read*Param` helpers.
 */
export function parseListParams(params: SearchParams, defaultPerPage = DEFAULT_PER_PAGE): ListParams {
  const page = readNumberParam(params, "page");

  return {
    page: page !== undefined && page >= 1 ? Math.trunc(page) : 1,
    per_page: clampPerPage(readNumberParam(params, "per_page"), defaultPerPage),
    search: readParam(params, "search"),
  };
}
