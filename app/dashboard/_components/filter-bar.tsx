"use client";

import { SearchIcon } from "../_lib/icons";
import { useDebouncedParam, useListParams } from "../_hooks/use-list-params";

export type SelectFilter = {
  /** URL param name, which is also the backend query param. */
  key: string;
  label: string;
  options: { value: string; label: string }[];
  /** Label for the "no filter" option. */
  allLabel?: string;
};

type FilterBarProps = {
  searchPlaceholder?: string;
  /** Omit to hide the search box for endpoints that take no `search` param. */
  searchable?: boolean;
  filters?: SelectFilter[];
};

/**
 * Search and filter controls for every server-paginated list.
 *
 * Writes to the URL rather than to local state, so the RSC re-fetches with the
 * new query. Each control is a plain input/select — the backend defines the
 * options, and the page decides which filters it supports.
 */
export function FilterBar({
  searchPlaceholder = "Search",
  searchable = true,
  filters = [],
}: FilterBarProps) {
  const { getParam, setParam, clearAll, isPending, debounceMs } = useListParams();
  const [draft, setDraft] = useDebouncedParam(
    getParam("search"),
    (value) => setParam("search", value || undefined),
    debounceMs,
  );

  const hasActiveFilter =
    Boolean(getParam("search")) || filters.some((filter) => Boolean(getParam(filter.key)));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {searchable && (
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-11 w-full rounded-lg border border-border-subtle bg-surface pl-9 pr-3.5 text-sm text-foreground outline-none transition duration-150 placeholder:text-text-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </div>
      )}

      {filters.map((filter) => (
        <select
          key={filter.key}
          value={getParam(filter.key)}
          aria-label={filter.label}
          onChange={(event) => setParam(filter.key, event.target.value || undefined)}
          className="h-11 rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
        >
          <option value="">{filter.allLabel ?? `All ${filter.label.toLowerCase()}`}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}

      {hasActiveFilter && (
        <button
          type="button"
          onClick={clearAll}
          className="flex h-11 items-center rounded-lg px-3 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          Clear filters
        </button>
      )}

      {isPending && <span className="text-sm text-text-muted">Updating…</span>}
    </div>
  );
}
