"use client";

import { useMemo, useState } from "react";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { SearchIcon } from "../../_lib/icons";
import { auditActionMeta } from "../../_lib/administration";
import { formatDateTime } from "../../_lib/format";
import type { AuditAction, AuditLogEntry, AuditTargetType } from "../../_services/administration-mock-data";

const TARGET_TYPES: (AuditTargetType | "all")[] = ["all", "admin", "user", "vendor"];

function selectClass() {
  return "h-11 rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";
}

export function AuditLogTable({ logs, showFilters = true }: { logs: AuditLogEntry[]; showFilters?: boolean }) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState<AuditAction | "all">("all");
  const [targetType, setTargetType] = useState<AuditTargetType | "all">("all");

  const actions = useMemo(() => Array.from(new Set(logs.map((l) => l.action))), [logs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesQuery =
        q.length === 0 || log.actor.toLowerCase().includes(q) || log.targetLabel.toLowerCase().includes(q) || log.targetId.toLowerCase().includes(q);
      const matchesAction = action === "all" || log.action === action;
      const matchesTarget = targetType === "all" || log.targetType === targetType;
      return matchesQuery && matchesAction && matchesTarget;
    });
  }, [logs, query, action, targetType]);

  return (
    <div className="flex flex-col gap-4">
      {showFilters && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actor or target"
              className="h-11 w-full rounded-lg border border-border-subtle bg-surface pl-9 pr-3.5 text-sm text-foreground outline-none transition duration-150 placeholder:text-text-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>

          <select value={action} onChange={(e) => setAction(e.target.value as AuditAction | "all")} className={selectClass()}>
            <option value="all">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {auditActionMeta[a].label}
              </option>
            ))}
          </select>

          <select value={targetType} onChange={(e) => setTargetType(e.target.value as AuditTargetType | "all")} className={selectClass()}>
            {TARGET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All target types" : t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">No matching activity</p>
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Action</TableHeadCell>
              <TableHeadCell>Actor</TableHeadCell>
              <TableHeadCell>Target</TableHeadCell>
              <TableHeadCell>Change</TableHeadCell>
              <TableHeadCell>Reason</TableHeadCell>
              <TableHeadCell>Date</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id}>
                <TableCell className="font-medium">{auditActionMeta[log.action].label}</TableCell>
                <TableCell className="text-text-secondary">{log.actor}</TableCell>
                <TableCell className="text-text-secondary">
                  {log.targetLabel} <span className="text-text-muted">({log.targetType})</span>
                </TableCell>
                <TableCell className="text-text-secondary">
                  {log.previousValue || log.newValue ? `${log.previousValue ?? "—"} → ${log.newValue ?? "—"}` : "—"}
                </TableCell>
                <TableCell className="text-text-secondary">{log.reason ?? "—"}</TableCell>
                <TableCell className="text-text-secondary">{formatDateTime(log.createdAt)}</TableCell>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
