"use client";

import { useCallback, useRef, useState } from "react";

import type { ActionResult } from "@/lib/api/errors";

/**
 * Fetch something the first time it is asked for, and keep it.
 *
 * For reads that are themselves recorded — payout details write a "viewed
 * payout" entry on every request — so they happen when somebody actually opens
 * the thing, once, rather than on page load or again on every tab switch.
 */
export function useOnDemand<T>(load: () => Promise<ActionResult<T>>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requested = useRef(false);

  const request = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    setLoading(true);

    load().then((result) => {
      setLoading(false);
      if (result.ok) setData(result.data);
      else setError(result.message);
    });
  }, [load]);

  return { data, error, loading, request };
}
