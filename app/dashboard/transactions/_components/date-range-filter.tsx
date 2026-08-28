"use client";

import { useListParams } from "../../_hooks/use-list-params";

/**
 * A from/to window for the finance screens.
 *
 * Writes to the URL like every other filter, so the server component re-fetches
 * with the new range rather than the page holding its own copy of the state.
 * Empty means all time — a finance screen that silently defaulted to "this
 * month" would make an all-time total impossible to ask for.
 */
export function DateRangeFilter({
  label = "Period",
}: {
  label?: string;
}) {
  const { getParam, setParam, clearAll, isPending } = useListParams();

  const from = getParam("from");
  const to = getParam("to");
  const hasRange = Boolean(from || to);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-secondary">{label} from</span>
        <input
          type="date"
          value={from ?? ""}
          max={to ?? undefined}
          onChange={(event) => setParam("from", event.target.value || undefined)}
          className="h-11 rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-secondary">to</span>
        <input
          type="date"
          value={to ?? ""}
          min={from ?? undefined}
          onChange={(event) => setParam("to", event.target.value || undefined)}
          className="h-11 rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </label>

      {hasRange && (
        <button
          type="button"
          onClick={clearAll}
          className="h-11 rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:border-brand hover:text-brand"
        >
          All time
        </button>
      )}

      {isPending && <span className="text-xs text-text-muted">Updating…</span>}
    </div>
  );
}
