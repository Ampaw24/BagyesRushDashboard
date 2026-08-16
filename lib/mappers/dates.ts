/**
 * The API speaks ISO strings; the dashboard's view models and its
 * formatDate/formatDateTime helpers speak `Date`. Conversion happens once, in
 * the mappers, so no component ever has to think about it.
 */

/** Parses an API timestamp, returning null for missing or unparseable values. */
export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * For fields the UI treats as always-present (`created_at` on a list row).
 * Falls back to the epoch rather than throwing, so one malformed row cannot
 * take down a whole page.
 */
export function toDateOrEpoch(value: string | null | undefined): Date {
  return toDate(value) ?? new Date(0);
}

/**
 * `customers/{id}.summary.last_ordered_at` is a raw DB datetime
 * ("2026-08-13 10:00:00"), which Safari refuses to parse. Normalising the
 * space to a "T" makes it valid ISO everywhere.
 */
export function toDateLoose(value: string | null | undefined): Date | null {
  if (!value) return null;
  return toDate(value.includes("T") ? value : value.replace(" ", "T"));
}
