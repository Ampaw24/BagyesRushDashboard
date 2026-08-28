/**
 * The marketplace runs in Ghana Cedis (config('marketplace.currency') = "GHS"),
 * so every money figure the API returns is GHS — not the dollars this file
 * used to render.
 */
const GHS = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 2,
});

/** Exact amount, for tables and detail rows where the figure must be readable. */
export function formatCurrency(value: number): string {
  return GHS.format(value);
}

/** Abbreviated amount, for stat tiles where space is tight. */
export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `GH₵${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `GH₵${(value / 1_000).toFixed(1)}K`;
  return GHS.format(value);
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Renders a nullable API timestamp, so pages don't each invent a placeholder. */
export function formatDateTimeOrDash(date: Date | null): string {
  return date ? formatDateTime(date) : "—";
}

export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * "4m ago", "2h ago", "3d ago" — for a feed where the exact minute rarely
 * matters but the recency always does.
 *
 * Falls back to a date once something is more than a week old, because
 * "23d ago" is harder to place than the date itself.
 */
export function formatRelative(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d ago`;

  return formatDate(date);
}
