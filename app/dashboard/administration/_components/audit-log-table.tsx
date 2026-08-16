import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { EmptyState } from "../../_components/empty-state";
import { Pagination } from "../../_components/pagination";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { formatDateTime } from "../../_lib/format";
import { ACTIVITY_ACTIONS, humaniseAction } from "@/lib/types/activity-actions";
import type { ActivityRow } from "@/lib/mappers/activity.mapper";
import type { PaginationMeta } from "@/lib/api/types";

const ACTION_FILTER: SelectFilter = {
  key: "action",
  label: "Action",
  allLabel: "All actions",
  options: ACTIVITY_ACTIONS.map((action) => ({ value: action, label: humaniseAction(action) })),
};

/** `subject_type` is matched on the model's class basename. */
const SUBJECT_FILTER: SelectFilter = {
  key: "subject_type",
  label: "Subject",
  allLabel: "All subjects",
  options: [
    { value: "User", label: "User" },
    { value: "Vendor", label: "Vendor" },
    { value: "Order", label: "Order" },
    { value: "Customer", label: "Customer" },
    { value: "Payment", label: "Payment" },
    { value: "MenuItem", label: "Menu item" },
  ],
};

/**
 * The audit trail from `GET /admin/activity`.
 *
 * Server component: filtering and paging happen in the API, driven by the URL,
 * so this only renders. The old version pulled every entry and filtered in a
 * `useMemo`, which could only ever search the rows already loaded.
 */
export function AuditLogTable({
  logs,
  pagination,
  showFilters = true,
}: {
  logs: ActivityRow[];
  pagination: PaginationMeta;
  showFilters?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {showFilters && (
        <FilterBar
          searchPlaceholder="Search description, administrator or action"
          filters={[ACTION_FILTER, SUBJECT_FILTER]}
        />
      )}

      {logs.length === 0 ? (
        <EmptyState
          title="No matching activity"
          description="Administrator actions are recorded here as they happen."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Action</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Administrator</TableHeadCell>
                <TableHeadCell>Subject</TableHeadCell>
                <TableHeadCell>IP</TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <TableCell className="font-medium">{log.actionLabel}</TableCell>
                  <TableCell className="text-text-secondary">{log.description}</TableCell>
                  <TableCell className="text-text-secondary">
                    {log.adminEmail}
                    {log.adminRole && (
                      <span className="mt-0.5 block text-xs text-text-muted">{log.adminRole}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {log.subjectType ? `${log.subjectType} #${log.subjectId}` : "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">{log.ipAddress ?? "—"}</TableCell>
                  <TableCell className="text-text-secondary">{formatDateTime(log.createdAt)}</TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}
    </div>
  );
}
