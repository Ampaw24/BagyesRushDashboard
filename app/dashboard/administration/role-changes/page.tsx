import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { AuditLogTable } from "../_components/audit-log-table";
import { listActivity } from "@/lib/services/activity.service";
import { toActivityRow } from "@/lib/mappers/activity.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams } from "@/lib/api/query";

export const metadata: Metadata = {
  title: "Role Changes — BagyesRUSH",
};

/**
 * The same audit feed as /audit-logs, pinned to `user.role_changed` — the
 * action AdminUserService records when a staff role is reassigned.
 */
export default async function RoleChangesPage(
  props: PageProps<"/dashboard/administration/role-changes">,
) {
  const permissions = await getPermissions();

  if (!can(permissions, "audit.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Role changes" description="Every staff role reassignment." />
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
    action: "user.role_changed",
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Role changes"
        description="Every staff role reassignment, with who made the change."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} change
            {page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      {/* The action is fixed by the route, so the action filter is hidden. */}
      <AuditLogTable
        logs={page.items.map(toActivityRow)}
        pagination={page.pagination}
        showFilters={false}
      />
    </div>
  );
}
