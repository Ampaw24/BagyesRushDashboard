/**
 * The marketplace runs in Ghana Cedis (config('marketplace.currency') = "GHS"),
 * so every money figure the API returns is GHS — not the dollars this file
 * used to render.
 */
/**
 * Grouping only, with the symbol written by hand.
 *
 * `Intl.NumberFormat("en-GH", { style: "currency" })` was a hydration hazard:
 * whether that locale resolves depends on the ICU data in the runtime, so a
 * Node build without it rendered "GHS 1,234.00" while the browser rendered
 * "GH₵1,234.00" — different text in the same node, which React reports in
 * production as a minified error.
 *
 * It was also inconsistent with `formatCompactCurrency` below, which has always
 * written the symbol literally, so one screen could show a figure two ways.
 * `en-US` grouping is present in every runtime, and the symbol is now ours.
 */
const GROUPED = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Exact amount, for tables and detail rows where the figure must be readable. */
export function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";

  return `${sign}GH₵${GROUPED.format(Math.abs(value))}`;
}

/** Abbreviated amount, for stat tiles where space is tight. */
export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `GH₵${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `GH₵${(value / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * The timezone is pinned, and that is the point.
 *
 * Without it these read the *runtime's* zone: the Node server renders in the
 * VPS timezone and the browser renders in the viewer's. Any difference between
 * the two puts different text in the same node on hydration, which React
 * reports in production as a minified error that a refresh appears to fix.
 *
 * Ghana keeps GMT year-round with no daylight saving, so this is also simply
 * the correct zone for every figure on this dashboard: an order placed at 14:05
 * in Accra should read 14:05 to everyone looking at it, including staff abroad.
 */
const ZONE = "Africa/Accra";

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: ZONE,
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: ZONE,
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

/**
 * How a ledger amount should read, given what actually happened to it.
 *
 * Colouring on `isCredit` alone made a **voided** credit render as a green
 * +GHS 100 - the same as money sitting in the wallet. On a cancelled order,
 * where the vendor's earning is written off and the customer refunded, an
 * admin glancing at the ledger saw the vendor being paid for an order that
 * never happened. The badge beside it said "Void", but the eye goes to the
 * green number.
 *
 * So the three states look like three different things:
 *
 * - **void** - struck through and muted, with no sign. This money did not move.
 * - **pending** - the credit is real but not released yet, so it is amber
 *   rather than the green of a settled balance.
 * - **available** - green for a credit, red for a debit, as a statement reads.
 */
export function ledgerAmountTone(isCredit: boolean, status: "pending" | "available" | "void"): string {
  if (status === "void") {
    return "text-text-muted line-through";
  }

  if (status === "pending") {
    return "text-status-warning";
  }

  return isCredit ? "text-status-good" : "text-status-critical";
}

/** The sign in front of it. A voided row gets none - nothing was added or taken. */
export function ledgerAmountSign(
  isCredit: boolean,
  status: "pending" | "available" | "void",
): string {
  if (status === "void") {
    return "";
  }

  return isCredit ? "+" : "\u2212";
}
