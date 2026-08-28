"use client";

import Link from "next/link";
import { useState } from "react";

import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { Badge } from "../../_components/status-badge";
import { ActionMenu, type ActionMenuItem } from "../../_components/action-menu";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { EmptyState } from "../../_components/empty-state";
import { Pagination } from "../../_components/pagination";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { reportStatusMeta } from "../../_lib/status";
import { formatDateTime } from "../../_lib/format";
import { updateReportStatusAction } from "../_actions";
import type { ReportRow } from "@/lib/mappers/report.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import {
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
  REPORT_TARGET_TYPES,
  REPORT_TARGET_TYPE_LABELS,
  type ReportStatus,
} from "@/lib/types/enums";

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "All statuses",
  options: REPORT_STATUSES.map((status) => ({
    value: status,
    label: REPORT_STATUS_LABELS[status],
  })),
};

const TARGET_FILTER: SelectFilter = {
  key: "target_type",
  label: "About",
  allLabel: "Anything",
  options: REPORT_TARGET_TYPES.map((type) => ({
    value: type,
    label: REPORT_TARGET_TYPE_LABELS[type],
  })),
};

/** Closing one requires a note — it is what the reporter is shown. */
const CLOSING: ReportStatus[] = ["resolved", "dismissed"];

type PendingAction = { report: ReportRow; status: ReportStatus };

export function ReportsTable({
  reports,
  pagination,
  canManage,
}: {
  reports: ReportRow[];
  pagination: PaginationMeta;
  canManage: boolean;
}) {
  const [pending, setPending] = useState<PendingAction | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchPlaceholder="Search reporter, target or description"
        filters={[STATUS_FILTER, TARGET_FILTER]}
      />

      {reports.length === 0 ? (
        <EmptyState
          title="Nothing to triage"
          description="Complaints filed from the customer, vendor and rider apps land here."
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Complaint</TableHeadCell>
              <TableHeadCell>From</TableHeadCell>
              <TableHeadCell>About</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Filed</TableHeadCell>
              <TableHeadCell>{""}</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const actions: ActionMenuItem[] = [];

              if (canManage && report.isOpen) {
                if (report.status === "pending") {
                  actions.push({
                    label: "Start reviewing",
                    onClick: () => setPending({ report, status: "in_review" }),
                  });
                }

                actions.push(
                  {
                    label: "Resolve",
                    onClick: () => setPending({ report, status: "resolved" }),
                  },
                  {
                    label: "Dismiss",
                    danger: true,
                    onClick: () => setPending({ report, status: "dismissed" }),
                  },
                );
              }

              return (
                <tr key={report.id} className="transition duration-150 hover:bg-surface-muted">
                  <TableCell>
                    <Link href={`/dashboard/support/${report.id}`} className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{report.reasonLabel}</span>
                      <span className="line-clamp-1 text-xs text-text-muted">
                        {report.description}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-foreground">{report.reporterName}</span>
                      <span className="text-xs capitalize text-text-muted">
                        {report.reporterRole}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-foreground">{report.targetName}</span>
                      <span className="text-xs text-text-muted">{report.targetTypeLabel}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge meta={reportStatusMeta[report.status]} />
                  </TableCell>
                  <TableCell>
                    <span className="text-text-secondary">{formatDateTime(report.createdAt)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {actions.length > 0 && <ActionMenu items={actions} />}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      <Pagination pagination={pagination} />

      {pending && (
        <ConfirmDialog
          title={`Mark as ${REPORT_STATUS_LABELS[pending.status].toLowerCase()}?`}
          description={
            CLOSING.includes(pending.status)
              ? // The note is what the reporter is shown; a status change with
                // no explanation is worse than no reply.
                "The reporter is notified and shown the note you write here."
              : "The reporter is notified that somebody is looking at this."
          }
          confirmLabel={REPORT_STATUS_LABELS[pending.status]}
          danger={pending.status === "dismissed"}
          requireReason={CLOSING.includes(pending.status)}
          reasonLabel="Note to the reporter"
          reasonMinLength={10}
          onCancel={() => setPending(null)}
          onConfirm={async (reason) => {
            const result = await updateReportStatusAction(pending.report.id, {
              status: pending.status,
              resolution_note: reason ?? null,
            });

            if (result.ok) setPending(null);

            return { ok: result.ok, message: result.message };
          }}
        />
      )}
    </div>
  );
}
