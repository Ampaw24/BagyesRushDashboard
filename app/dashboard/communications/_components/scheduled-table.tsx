"use client";

import { useState } from "react";
import Link from "next/link";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { Badge } from "../../_components/status-badge";
import { channelMeta, communicationStatusMeta, communicationTypeMeta } from "../../_lib/communications";
import { formatDateTime } from "../../_lib/format";
import type { Communication } from "../../_services/communications-mock-data";

export function ScheduledTable({ communications }: { communications: Communication[] }) {
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());

  const visible = communications.filter((c) => !cancelledIds.has(c.id));

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-foreground">Nothing scheduled</p>
        <p className="text-sm text-text-muted">Communications you schedule for later will show up here.</p>
      </div>
    );
  }

  return (
    <TableShell>
      <thead>
        <tr>
          <TableHeadCell>Communication</TableHeadCell>
          <TableHeadCell>Type</TableHeadCell>
          <TableHeadCell>Channels</TableHeadCell>
          <TableHeadCell>Recipients</TableHeadCell>
          <TableHeadCell>Scheduled for</TableHeadCell>
          <TableHeadCell>Status</TableHeadCell>
          <TableHeadCell>Action</TableHeadCell>
        </tr>
      </thead>
      <tbody>
        {visible.map((c) => (
          <tr key={c.id}>
            <TableCell className="font-medium">
              <Link href={`/dashboard/communications/history/${c.id}`} className="hover:text-brand">
                {c.title}
              </Link>
            </TableCell>
            <TableCell className="text-text-secondary">{communicationTypeMeta[c.type].label}</TableCell>
            <TableCell className="text-text-secondary">{c.channels.map((ch) => channelMeta[ch].label).join(" + ")}</TableCell>
            <TableCell className="text-text-secondary">{c.audience.resolvedCount.toLocaleString()}</TableCell>
            <TableCell className="text-text-secondary">{c.scheduledAt ? formatDateTime(c.scheduledAt) : "—"}</TableCell>
            <TableCell>
              <Badge meta={communicationStatusMeta[c.status]} />
            </TableCell>
            <TableCell>
              <button
                type="button"
                onClick={() => setCancelledIds((prev) => new Set(prev).add(c.id))}
                className="flex h-9 items-center rounded-lg border border-border-subtle px-3 text-xs font-medium text-status-critical transition duration-150 hover:bg-surface-muted"
              >
                Cancel
              </button>
            </TableCell>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
