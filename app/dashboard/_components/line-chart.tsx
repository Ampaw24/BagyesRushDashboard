"use client";

import { useState } from "react";
import { formatCompactNumber, formatCurrency } from "../_lib/format";
import type { DayPoint } from "../_services/mock-data";

type LineChartProps = {
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

export function LineChart({ data, unit, unitLabel, color = "var(--color-brand)" }: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const formatValue = (value: number) =>
    unit === "currency" ? formatCurrency(value) : `${formatCompactNumber(value)}${unitLabel ? ` ${unitLabel}` : ""}`;

  const values = data.map((d) => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const range = max - min || 1;

  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const points = data.map((d, i) => {
    const x = PAD_X + (i / (data.length - 1)) * plotWidth;
    const y = PAD_TOP + plotHeight - ((d.value - min) / range) * plotHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${PAD_TOP + plotHeight} L${points[0].x.toFixed(1)},${PAD_TOP + plotHeight} Z`;

  const gridLines = [0, 0.33, 0.66, 1].map((t) => PAD_TOP + plotHeight * t);
  const labelEvery = Math.ceil(data.length / 7);
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative w-full">
      <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" role="img" aria-label="Line chart">
        {gridLines.map((y, i) => (
          <line key={i} x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} stroke="var(--color-chart-grid)" strokeWidth={1} />
        ))}

        <path d={areaPath} fill={color} fillOpacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={i}>
            {hoverIndex === i && (
              <>
                <line x1={p.x} x2={p.x} y1={PAD_TOP} y2={PAD_TOP + plotHeight} stroke="var(--color-chart-grid)" strokeWidth={1} />
                <circle cx={p.x} cy={p.y} r={4} fill={color} stroke="var(--color-surface)" strokeWidth={2} />
              </>
            )}
            <rect
              x={p.x - plotWidth / data.length / 2}
              y={PAD_TOP}
              width={Math.max(plotWidth / data.length, 12)}
              height={plotHeight}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${p.date}: ${formatValue(p.value)}`}
              onMouseEnter={() => setHoverIndex(i)}
              onFocus={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onBlur={() => setHoverIndex(null)}
            />
          </g>
        ))}

        {points
          .filter((_, i) => i % labelEvery === 0)
          .map((p, i) => (
            <text key={i} x={p.x} y={HEIGHT - 6} textAnchor="middle" fontSize={11} fill="var(--color-text-muted)">
              {p.date}
            </text>
          ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs shadow-sm"
          style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%`, marginTop: -8 }}
        >
          <p className="font-semibold text-foreground">{formatValue(hovered.value)}</p>
          <p className="text-text-muted">{hovered.date}</p>
        </div>
      )}
    </div>
  );
}
