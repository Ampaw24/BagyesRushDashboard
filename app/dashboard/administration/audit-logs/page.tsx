import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { ExportAction } from "../../_components/export-action";
import { NoPermissionState } from "../../_components/empty-state";
import { AuditLogTable } from "../_components/audit-log-table";
import { listActivity } from "@/lib/services/activity.service";
import { toActivityRow } from "@/lib/mappers/activity.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readNumberParam, readParam } from "@/lib/api/query";

export const metadata: Metadata = {
  title: "Audit Logs — BagyesRUSH",
};

export default async function AuditLogsPage(props: PageProps<"/dashboard/administration/audit-logs">) {
  const permissions = await getPermissions();

  // `audit.view` is held only by super administrators and finance.
  if (!can(permissions, "audit.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Audit logs" description="Every administrator action, recorded." />
        <NoPermissionState what="audit logs" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params, 25);

  const page = await listActivity({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    action: readParam(params, "action"),
    subject_type: readParam(params, "subject_type"),
    subject_id: readNumberParam(params, "subject_id"),
    admin_id: readNumberParam(params, "admin_id"),
    from: readParam(params, "from"),
    to: readParam(params, "to"),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit logs"
        description="Every administrator action, recorded with who did it and from where."
        action={
          <div className="flex items-center gap-3">
            <ExportAction resource="audit-log" filters={{ search: list.search }} />
            <span className="text-sm text-text-muted">
              {page.pagination.total.toLocaleString()} entr
              {page.pagination.total === 1 ? "y" : "ies"}
            </span>
          </div>
        }
      />
      <AuditLogTable logs={page.items.map(toActivityRow)} pagination={page.pagination} />
    </div>
  );
}
