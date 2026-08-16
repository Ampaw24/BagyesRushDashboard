"use client";

import { useState } from "react";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { CheckCircleIcon, XCircleIcon } from "../../_lib/icons";
import { formatDateTime } from "../../_lib/format";
import type { RiderApplication } from "../../_services/mock-data";

export function RequestsTable({ applications }: { applications: RiderApplication[] }) {
  const [rows, setRows] = useState(applications);

  function remove(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-foreground">No pending rider requests</p>
        <p className="text-sm text-text-muted">New applications will show up here.</p>
      </div>
    );
  }

  return (
    <TableShell>
      <thead>
        <tr>
          <TableHeadCell>Applicant</TableHeadCell>
          <TableHeadCell>Phone</TableHeadCell>
          <TableHeadCell>Vehicle</TableHeadCell>
          <TableHeadCell>City</TableHeadCell>
          <TableHeadCell>Submitted</TableHeadCell>
          <TableHeadCell>Actions</TableHeadCell>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell className="text-text-secondary">{row.phone}</TableCell>
            <TableCell className="text-text-secondary">{row.vehicleType}</TableCell>
            <TableCell className="text-text-secondary">{row.city}</TableCell>
            <TableCell className="text-text-secondary">{formatDateTime(row.submittedAt)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-status-good/10 px-3 text-xs font-medium text-status-good transition duration-150 hover:bg-status-good/15"
                >
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-status-critical/10 px-3 text-xs font-medium text-status-critical transition duration-150 hover:bg-status-critical/15"
                >
                  <XCircleIcon className="h-3.5 w-3.5" />
                  Reject
                </button>
              </div>
            </TableCell>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
