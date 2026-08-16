"use client";

import { useState } from "react";

export type DistributionSegment = { key: string; label: string; value: number; colorClassName: string };

export function DistributionBar({ segments, ariaLabel }: { segments: DistributionSegment[]; ariaLabel: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-8 w-full gap-[2px] overflow-hidden rounded-lg" role="img" aria-label={ariaLabel}>
        {segments.map((s, i) => {
          const percent = (s.value / total) * 100;
          if (percent === 0) return null;
          return (
            <div
              key={s.key}
              className={`relative flex items-center justify-center text-xs font-medium text-white transition-opacity duration-150 ${s.colorClassName} ${
                i === 0 ? "rounded-l-lg" : ""
              } ${i === segments.length - 1 ? "rounded-r-lg" : ""} ${hovered && hovered !== s.key ? "opacity-55" : ""}`}
              style={{ width: `${percent}%` }}
              tabIndex={0}
              role="button"
              aria-label={`${s.label}: ${s.value} (${percent.toFixed(0)}%)`}
              onMouseEnter={() => setHovered(s.key)}
              onFocus={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
              onBlur={() => setHovered(null)}
            >
              {percent >= 12 && <span className="break-words px-1">{percent.toFixed(0)}%</span>}

              {hovered === s.key && (
                <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs shadow-sm">
                  <p className="whitespace-nowrap font-semibold text-foreground">{s.value.toLocaleString()}</p>
                  <p className="whitespace-nowrap text-text-muted">{s.label}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-xs text-text-secondary">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${s.colorClassName}`} />
            <span className="break-words">
              {s.label} · {s.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
