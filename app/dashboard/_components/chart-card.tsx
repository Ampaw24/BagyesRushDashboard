"use client";

import { useState, type ReactNode } from "react";
import { ChartIcon, TableIcon } from "../_lib/icons";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  chart: ReactNode;
  table: ReactNode;
  legend?: ReactNode;
};

export function ChartCard({ title, subtitle, chart, table, legend }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="break-words text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="break-words text-xs text-text-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
          aria-label={showTable ? "Show chart view" : "Show table view"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          {showTable ? <ChartIcon className="h-4 w-4" /> : <TableIcon className="h-4 w-4" />}
        </button>
      </div>

      {showTable ? <div className="overflow-x-auto">{table}</div> : chart}
      {!showTable && legend}
    </div>
  );
}
