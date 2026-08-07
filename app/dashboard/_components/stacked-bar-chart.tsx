"use client";

import { useState } from "react";
import { orderStatusMeta, type OrderStatus } from "../_lib/status";
import type { StatusCount } from "../_services/mock-data";

const FILL_CLASS: Record<OrderStatus, string> = {
  pending: "bg-status-warning",
  in_transit: "bg-status-info",
  delivered: "bg-status-good",
  cancelled: "bg-status-critical",
};

export function StackedBarChart({ data }: { data: StatusCount[] }) {
  const [hovered, setHovered] = useState<OrderStatus | null>(null);
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-8 w-full gap-[2px] overflow-hidden rounded-lg" role="img" aria-label="Orders by status">
        {data.map((d, i) => {
          const percent = (d.count / total) * 100;
          if (percent === 0) return null;
          const isFirst = i === 0;
          const isLast = i === data.length - 1;
          return (
            <div
              key={d.status}
              className={`relative flex items-center justify-center text-xs font-medium text-white transition-opacity duration-150 ${FILL_CLASS[d.status]} ${
                isFirst ? "rounded-l-lg" : ""
              } ${isLast ? "rounded-r-lg" : ""} ${hovered && hovered !== d.status ? "opacity-55" : ""}`}
              style={{ width: `${percent}%` }}
              tabIndex={0}
              role="button"
              aria-label={`${orderStatusMeta[d.status].label}: ${d.count} orders (${percent.toFixed(0)}%)`}
              onMouseEnter={() => setHovered(d.status)}
              onFocus={() => setHovered(d.status)}
              onMouseLeave={() => setHovered(null)}
              onBlur={() => setHovered(null)}
            >
              {percent >= 12 && <span className="break-words px-1">{percent.toFixed(0)}%</span>}

              {hovered === d.status && (
                <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs shadow-sm">
                  <p className="whitespace-nowrap font-semibold text-foreground">{d.count} orders</p>
                  <p className="whitespace-nowrap text-text-muted">{orderStatusMeta[d.status].label}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2 text-xs text-text-secondary">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${FILL_CLASS[d.status]}`} />
            <span className="break-words">
              {orderStatusMeta[d.status].label} · {d.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
