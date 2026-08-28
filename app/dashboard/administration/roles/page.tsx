import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { RolesMatrix } from "./roles-matrix";
import { getManagedRoles, getRoles } from "@/lib/services/profile.service";
import { can, getPermissions } from "@/lib/auth/guard";
import type { RolesResponseDto } from "@/lib/types/api";

export const metadata: Metadata = {
  title: "Roles — BagyesRUSH",
};

const DESCRIPTION = "What each administrator role can do.";

/**
 * What each staff role may do.
 *
 * Editing needs `users.assign_role` (super admin only): granting a capability
 * weighs the same as granting a role. Anyone who can see staff accounts still
 * gets the read-only view, so they can tell what a role means before assigning
 * somebody to it.
 *
 * The read-only view is also the fallback when the connected backend predates
 * role editing — `/admin/roles` has existed all along, `/admin/roles/manage`
 * has not, and showing an error page for a pending deploy sends somebody
 * looking for a bug that is not there.
 */
export default async function RolesPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "users.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Roles" description={DESCRIPTION} />
        <NoPermissionState what="roles" />
      </div>
    );
  }

  const managed = can(permissions, "users.assign_role") ? await getManagedRoles() : null;

  if (!managed) {
    return <ReadOnlyRoles roles={await getRoles()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles"
        description="Tick what each role may do. A role you have never edited follows the defaults in code, so it picks up new modules on its own — editing one freezes it until you sync or reset."
      />

      <RolesMatrix roles={managed.roles} permissions={managed.permissions} />
    </div>
  );
}

function ReadOnlyRoles({ roles }: { roles: RolesResponseDto }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles"
        description={`${DESCRIPTION} Only a super administrator can change this.`}
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
    </div>
  );
}
