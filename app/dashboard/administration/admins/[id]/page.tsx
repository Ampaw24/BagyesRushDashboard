import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";

import { PageHeader } from "../../../_components/page-header";
import { NoPermissionState } from "../../../_components/empty-state";
import { AdminDetail } from "./_components/admin-detail";
import { AuditLogTable } from "../../_components/audit-log-table";
import { getUser, listUsers } from "@/lib/services/admin-users.service";
import { getAdminProfile } from "@/lib/services/profile.service";
import { listActivity } from "@/lib/services/activity.service";
import { toAdminUserRow } from "@/lib/mappers/admin-user.mapper";
import { toActivityRow } from "@/lib/mappers/activity.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { isNotFound } from "@/lib/api/errors";
import { emptyPage } from "@/lib/api/types";
import { parseListParams } from "@/lib/api/query";

export const metadata: Metadata = {
  title: "Administrator — BagyesRUSH",
};

export default async function AdminDetailPage(
  props: PageProps<"/dashboard/administration/admins/[id]">,
) {
  const { id } = await props.params;
  const permissions = await getPermissions();

  if (!can(permissions, "users.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Administrator" description="Staff account detail." />
        <NoPermissionState what="staff accounts" />
      </div>
    );
  }

  const adminId = Number(id);
  if (!Number.isFinite(adminId)) notFound();

  const list = parseListParams(await props.searchParams, 25);

  const [admin, profile, superAdmins, activityPage] = await Promise.all([
    loadAdmin(adminId),
    getAdminProfile(),
    listUsers({ role: "admin", admin_role: "super_admin", status: "active", per_page: 1 }),
    // Their own audit trail. Only super admins and finance hold `audit.view`,
    // so this degrades to an empty feed rather than failing the page.
    can(permissions, "audit.view")
      ? listActivity({ admin_id: adminId, page: list.page, per_page: list.per_page })
      : Promise.resolve(emptyPage<never>(list.per_page)),
  ]);

  return (
    <AdminDetail
      admin={admin}
      activitySlot={
        // Rendered here so the table stays a Server Component; filters are
        // hidden because this feed is already pinned to one admin_id.
        <AuditLogTable
          logs={activityPage.items.map(toActivityRow)}
          pagination={activityPage.pagination}
          showFilters={false}
        />
      }
      context={{
        currentAdminId: profile.id,
        activeSuperAdminCount: superAdmins.pagination.total,
        canManage: can(permissions, "users.manage"),
        canAssignRole: can(permissions, "users.assign_role"),
      }}
    />
  );
}

/** A missing account arrives as a 422 with `errors.user`, not a 404. */
async function loadAdmin(id: number) {
  try {
    return toAdminUserRow(await getUser(id));
  } catch (error) {
    unstable_rethrow(error);
    if (isNotFound(error, "user")) notFound();
    throw error;
  }
}
