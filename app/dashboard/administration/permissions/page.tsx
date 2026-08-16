import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { getRoles } from "@/lib/services/profile.service";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Permissions — Bagyes Rush Delivery",
};

/**
 * The permission catalogue, grouped exactly as `GET /admin/roles` returns it.
 * Read-only: permissions are enum cases, not records, so there is nothing to
 * create or edit.
 */
export default async function PermissionsPage() {
  const held = await getPermissions();

  if (!can(held, "users.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Permissions" description="Every permission the API recognises." />
        <NoPermissionState what="permissions" />
      </div>
    );
  }

  const { permissions } = await getRoles();
  const groups = Object.entries(permissions);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Permissions"
        description="Every permission the API recognises, grouped by area. Yours are highlighted."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {groups.map(([group, entries]) => (
          <div
            key={group}
            className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm"
          >
            <h2 className="break-words text-sm font-semibold capitalize text-foreground">{group}</h2>
            <ul className="flex flex-col gap-2">
              {entries.map((permission) => {
                const granted = held.includes(permission.value);
                return (
                  <li
                    key={permission.value}
                    className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-2 last:border-0 last:pb-0"
                  >
                    <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-text-secondary">
                      {permission.value}
                    </code>
                    <span className="break-words text-sm font-medium text-foreground">
                      {permission.label}
                    </span>
                    {granted && (
                      <span className="ml-auto rounded-full bg-status-good/10 px-2 py-0.5 text-xs font-medium text-status-good">
                        You have this
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
