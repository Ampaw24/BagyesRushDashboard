import type { Metadata } from "next";

import { PageHeader } from "../_components/page-header";
import { NoPermissionState } from "../_components/empty-state";
import { AdminUsersTable } from "./admin-users-table";
import { listUsers } from "@/lib/services/admin-users.service";
import { getAdminProfile } from "@/lib/services/profile.service";
import { toAdminUserRow } from "@/lib/mappers/admin-user.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readEnumParam } from "@/lib/api/query";
import { ADMIN_ROLES, USER_STATUSES } from "@/lib/types/enums";

export const metadata: Metadata = {
  title: "Admin Users — Bagyes Rush Delivery",
};

export default async function AdminUsersPage(props: PageProps<"/dashboard/admin-users">) {
  const permissions = await getPermissions();

  if (!can(permissions, "users.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Admin users" description="Staff accounts with dashboard access." />
        <NoPermissionState what="staff accounts" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const [page, profile, superAdmins] = await Promise.all([
    listUsers({
      page: list.page,
      per_page: list.per_page,
      search: list.search,
      // Only staff belong on this screen; the endpoint covers every role.
      role: "admin",
      admin_role: readEnumParam(params, "admin_role", ADMIN_ROLES),
      status: readEnumParam(params, "status", USER_STATUSES),
    }),
    getAdminProfile(),
    // Counted so the UI can pre-empt "the last super administrator cannot be
    // demoted" instead of only surfacing it as a 422 after the click.
    listUsers({ role: "admin", admin_role: "super_admin", status: "active", per_page: 1 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin users"
        description="Staff accounts with dashboard access."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} account
            {page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />

      <AdminUsersTable
        admins={page.items.map(toAdminUserRow)}
        pagination={page.pagination}
        context={{
          currentAdminId: profile.id,
          activeSuperAdminCount: superAdmins.pagination.total,
          canManage: can(permissions, "users.manage"),
          canAssignRole: can(permissions, "users.assign_role"),
        }}
      />
    </div>
  );
}
