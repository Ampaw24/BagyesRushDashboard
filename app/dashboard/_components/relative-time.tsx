"use client";

import { useEffect, useState } from "react";

import { formatDateTime, formatRelative } from "../_lib/format";

/**
 * "4m ago", without the hydration mismatch.
 *
 * `formatRelative` reads `Date.now()`. Client components are still rendered on
 * the server for the initial HTML, so the server wrote "2m ago" and the browser
 * hydrated a moment later and rendered "3m ago" — different text in the same
 * node, which React reports in production as a minified error and recovers from
 * by discarding the server HTML.
 *
 * That is exactly the fault that looks intermittent and "goes away on refresh":
 * whether it fires at all depends on whether a clock boundary happened to fall
 * between the render and the hydration.
 *
 * So the server renders the absolute time, which cannot disagree with itself,
 * and the relative label is swapped in after mount. It then re-ticks every
 * thirty seconds, which the bare helper never did — a feed left open used to go
 * on claiming "just now" an hour later.
 *
 * The timestamp is held as a number rather than a Date so the effect depends on
 * a primitive: a `Date` built during render is a new object every time and
 * would re-run the effect forever.
 */
export function RelativeTime({ date, className }: { date: Date | string; className?: string }) {
  const timestamp = typeof date === "string" ? Date.parse(date) : date.getTime();
  const valid = !Number.isNaN(timestamp);

  // Absolute on the server and on the first client render, so the two agree.
  const [label, setLabel] = useState(() => (valid ? formatDateTime(new Date(timestamp)) : "—"));

  useEffect(() => {
    if (!valid) return;

    const value = new Date(timestamp);
    const tick = () => setLabel(formatRelative(value));

    tick();
    const timer = setInterval(tick, 30_000);

    return () => clearInterval(timer);
  }, [timestamp, valid]);

  if (!valid) return <span className={className}>—</span>;

  const value = new Date(timestamp);

  return (
    <time dateTime={value.toISOString()} title={formatDateTime(value)} className={className}>
      {label}
    </time>
  );
}
