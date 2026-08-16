"use client";

import { useListParams } from "../_hooks/use-list-params";
import type { PaginationMeta } from "@/lib/api/types";

/**
 * Pager for the backend's `data.pagination` block.
 *
 * Renders nothing for a single page, so short lists look exactly as they did
 * before pagination existed.
 */
export function Pagination({ pagination }: { pagination: PaginationMeta }) {
  const { setPage, isPending } = useListParams();
  const { current_page, last_page, total, from, to } = pagination;

  if (last_page <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-sm text-text-muted">
        {from !== null && to !== null
          ? `Showing ${from}–${to} of ${total}`
          : `${total} result${total === 1 ? "" : "s"}`}
      </p>

      <div className="flex items-center gap-2">
        <PageButton
          label="Previous"
          disabled={current_page <= 1 || isPending}
          onClick={() => setPage(current_page - 1)}
        />
        <span className="px-2 text-sm text-text-secondary" aria-current="page">
          Page {current_page} of {last_page}
        </span>
        <PageButton
          label="Next"
          disabled={current_page >= last_page || isPending}
          onClick={() => setPage(current_page + 1)}
        />
      </div>
    </nav>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      // min-h/min-w keep the 44px touch target the project rules require.
      className="flex h-11 min-w-11 items-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
