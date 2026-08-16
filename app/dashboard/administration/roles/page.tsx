import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { RolesMatrix } from "./roles-matrix";
import { getRoles } from "@/lib/services/profile.service";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Roles — Bagyes Rush Delivery",
};

export default async function RolesPage() {
  const permissions = await getPermissions();

  // `/admin/roles` itself has no permission gate beyond role:admin, but this
  // page only makes sense to someone who can see or assign staff accounts.
  if (!can(permissions, "users.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Roles" description="What each administrator role can do." />
        <NoPermissionState what="roles" />
      </div>
    );
  }

  const roles = await getRoles();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles"
        description="What each administrator role can do. Roles are fixed in the API and cannot be edited here."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {roles.roles.map((role) => (
          <div
            key={role.value}
            className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm"
          >
            <h2 className="break-words text-sm font-semibold text-foreground">{role.label}</h2>
            <p className="break-words text-sm text-text-secondary">{role.description}</p>
            <p className="text-xs text-text-muted">
              {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>

      <RolesMatrix roles={roles.roles} permissions={roles.permissions} />
    </div>
  );
}
