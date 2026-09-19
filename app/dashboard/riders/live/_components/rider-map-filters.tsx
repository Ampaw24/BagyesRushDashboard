"use client";

import type { ConnectionState } from "@/lib/realtime/use-rider-positions";

export type MapFilter = "all" | "busy" | "idle" | "stale";

const FILTERS: Array<{ value: MapFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "busy", label: "On a job" },
  { value: "idle", label: "Idle" },
  { value: "stale", label: "Not reporting" },
];

/**
 * Narrow the map, and say whether it is actually live.
 *
 * The connection pill matters more than it looks: without it a socket that has
 * quietly dropped leaves a map full of markers that simply stop moving, which
 * is indistinguishable from a city where nobody is riding.
 */
export function RiderMapFilters({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  counts,
  connection,
}: {
  filter: MapFilter;
  onFilterChange: (filter: MapFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
  counts: Record<MapFilter, number>;
  connection: ConnectionState;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1 rounded-lg border border-border-subtle bg-surface p-1">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onFilterChange(option.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              filter === option.value
                ? "bg-brand text-white"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {option.label}
            <span className="ml-1.5 text-xs opacity-70">{counts[option.value]}</span>
          </button>
        ))}
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Find a rider or plate"
        className="h-9 min-w-52 flex-1 rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none placeholder:text-muted focus:border-brand"
      />

      <ConnectionPill state={connection} />
    </div>
  );
}

function ConnectionPill({ state }: { state: ConnectionState }) {
  const meta: Record<ConnectionState, { label: string; className: string; pulse: boolean }> = {
    live: { label: "Live", className: "bg-emerald-500/10 text-emerald-600", pulse: true },
    connecting: { label: "Connecting", className: "bg-amber-500/10 text-amber-600", pulse: true },
    offline: { label: "Reconnecting", className: "bg-red-500/10 text-red-600", pulse: false },
    unavailable: {
      label: "Live updates off",
      className: "bg-surface-muted text-muted",
      pulse: false,
    },
  };

  const { label, className, pulse } = meta[state];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
      title={
        state === "unavailable"
          ? "Reverb is not configured for this deployment, so positions will not update on their own."
          : undefined
      }
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}
