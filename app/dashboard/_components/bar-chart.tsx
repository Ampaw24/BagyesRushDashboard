"use client";

import { useState } from "react";
import { formatCompactNumber, formatCurrency } from "../_lib/format";
import type { DayPoint } from "../_services/mock-data";

type BarChartProps = {
  data: DayPoint[];
  unit: "count" | "currency";
  unitLabel?: string;
  color?: string;
};

const WIDTH = 600;
const HEIGHT = 200;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const PAD_X = 8;
const MAX_BAR_WIDTH = 24;
const GAP = 2;

export function BarChart({ data, unit, unitLabel, color = "var(--color-brand)" }: BarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const formatValue = (value: number) =>
    unit === "currency" ? formatCurrency(value) : `${formatCompactNumber(value)}${unitLabel ? ` ${unitLabel}` : ""}`;

  const values = data.map((d) => d.value);
  const max = Math.max(...values);

  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slot = plotWidth / data.length;
  const barWidth = Math.min(MAX_BAR_WIDTH, slot - GAP);

  const gridLines = [0, 0.33, 0.66, 1].map((t) => PAD_TOP + plotHeight * t);
  const labelEvery = Math.ceil(data.length / 7);

  const bars = data.map((d, i) => {
    const barHeight = (d.value / max) * plotHeight;
    const x = PAD_X + i * slot + (slot - barWidth) / 2;
    const y = PAD_TOP + plotHeight - barHeight;
    return { x, y, barHeight, ...d };
  });

  const hovered = hoverIndex !== null ? bars[hoverIndex] : null;

  return (
    <div className="relative w-full">
      <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" role="img" aria-label="Bar chart">
        {gridLines.map((y, i) => (
          <line key={i} x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} stroke="var(--color-chart-grid)" strokeWidth={1} />
        ))}

        {bars.map((b, i) => (
          <g key={i}>
            <rect
              x={b.x}
              y={b.y}
              width={barWidth}
              height={Math.max(b.barHeight, 1)}
              rx={4}
              fill={color}
              opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.55}
            />
            <rect
              x={PAD_X + i * slot}
              y={PAD_TOP}
              width={slot}
              height={plotHeight}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${b.date}: ${formatValue(b.value)}`}
              onMouseEnter={() => setHoverIndex(i)}
              onFocus={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onBlur={() => setHoverIndex(null)}
            />
          </g>
        ))}

        {bars
          .filter((_, i) => i % labelEvery === 0)
          .map((b, i) => (
            <text key={i} x={b.x + barWidth / 2} y={HEIGHT - 6} textAnchor="middle" fontSize={11} fill="var(--color-text-muted)">
              {b.date}
            </text>
          ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs shadow-sm"
          style={{ left: `${((hovered.x + barWidth / 2) / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%`, marginTop: -8 }}
        >
          <p className="font-semibold text-foreground">{formatValue(hovered.value)}</p>
          <p className="text-text-muted">{hovered.date}</p>
        </div>
      )}
    </div>
  );
}
