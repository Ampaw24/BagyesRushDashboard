import type { ReactNode } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "../_lib/icons";
import { Sparkline } from "./sparkline";
import { formatSignedPercent } from "../_lib/format";

type StatTileProps = {
  label: string;
  value: string;
  icon: ReactNode;
  deltaPercent?: number;
  trend?: number[];
};

export function StatTile({ label, value, icon, deltaPercent, trend }: StatTileProps) {
  const isUp = typeof deltaPercent === "number" && deltaPercent >= 0;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          {icon}
        </span>
        {trend && <Sparkline values={trend} />}
      </div>

      <div className="flex flex-col gap-1">
        <p className="break-words text-sm text-text-secondary">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {typeof deltaPercent === "number" && (
            <span
              className={`flex items-center gap-0.5 text-xs font-medium ${
                isUp ? "text-delta-good" : "text-status-critical"
              }`}
            >
              {isUp ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
              {formatSignedPercent(deltaPercent)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
