"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Keeps list filters in the URL rather than in component state.
 *
 * The backend filters and paginates server-side, so the RSC needs to know the
 * filters before it fetches. Putting them in the URL means the server re-runs
 * the query on every change, and it makes a filtered view shareable and
 * survivable across a refresh — none of which the previous local `useState`
 * filtering could do.
 */
export function useListParams(debounceMs = 300) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const commit = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  /** Sets or clears a filter. Any filter change returns to page 1. */
  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      commit((params) => {
        if (!value) params.delete(key);
        else params.set(key, value);
        if (key !== "page") params.delete("page");
      });
    },
    [commit],
  );

  const setPage = useCallback(
    (page: number) => {
      commit((params) => {
        if (page <= 1) params.delete("page");
        else params.set("page", String(page));
      });
    },
    [commit],
  );

  const clearAll = useCallback(() => {
    startTransition(() => router.replace(pathname, { scroll: false }));
  }, [pathname, router]);

  const getParam = useCallback((key: string) => searchParams.get(key) ?? "", [searchParams]);

  return { getParam, setParam, setPage, clearAll, isPending, debounceMs };
}

/**
 * Debounced text input state backed by a URL param, so typing does not fire a
 * server round trip per keystroke.
 */
export function useDebouncedParam(
  value: string,
  onCommit: (value: string) => void,
  delayMs: number,
) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Re-sync when the URL changes from elsewhere (back button, Clear filters).
  // Adjusting during render rather than in an effect — React re-runs this
  // component immediately without committing the stale value or painting twice.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onCommit(draft), delayMs);
    return () => clearTimeout(timer);
    // `onCommit` is recreated per render by design; depending on it here would
    // reset the timer on every render and the debounce would never fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, value, delayMs]);

  return [draft, setDraft] as const;
}
