"use client";

import { useState } from "react";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { UnlockIcon } from "../../_lib/icons";
import { formatDateTime } from "../../_lib/format";
import type { BlockedRider } from "../../_services/mock-data";

export function BlockedTable({ riders }: { riders: BlockedRider[] }) {
  const [rows, setRows] = useState(riders);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-foreground">No blocked riders</p>
        <p className="text-sm text-text-muted">Riders you block will show up here.</p>
      </div>
    );
  }

  return (
    <TableShell>
      <thead>
        <tr>
          <TableHeadCell>Rider</TableHeadCell>
          <TableHeadCell>Phone</TableHeadCell>
          <TableHeadCell>Reason</TableHeadCell>
          <TableHeadCell>Blocked on</TableHeadCell>
          <TableHeadCell>Actions</TableHeadCell>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell className="text-text-secondary">{row.phone}</TableCell>
            <TableCell className="text-text-secondary">{row.reason}</TableCell>
            <TableCell className="text-text-secondary">{formatDateTime(row.blockedAt)}</TableCell>
            <TableCell>
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-brand/10 px-3 text-xs font-medium text-brand transition duration-150 hover:bg-brand/15"
              >
                <UnlockIcon className="h-3.5 w-3.5" />
                Unblock
              </button>
            </TableCell>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
