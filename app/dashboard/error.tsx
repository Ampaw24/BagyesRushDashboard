"use client";

import { useEffect } from "react";

/**
 * Catches failures from any dashboard page — most often the API being
 * unreachable, or a 403 for a permission the role does not hold.
 *
 * Next.js 16 names the recovery prop `retry` (it was `reset` in earlier
 * versions).
 */
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
      <h2 className="break-words text-base font-semibold text-foreground">Something went wrong</h2>
      <p className="max-w-md break-words text-sm text-text-secondary">{error.message}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-4 flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
      >
        Try again
      </button>
    </div>
  );
}
