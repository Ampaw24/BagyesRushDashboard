"use client";

import { Fragment, useState } from "react";
import type { AdminRole } from "../../_services/mock-data";
import type { Permission, RoleDefinition } from "../../_services/administration-mock-data";

export function RolesMatrix({ roles, permissions }: { roles: RoleDefinition[]; permissions: Permission[] }) {
  const [grants, setGrants] = useState<Record<AdminRole, Set<string>>>(() =>
    Object.fromEntries(roles.map((r) => [r.role, new Set(r.permissions)])) as Record<AdminRole, Set<string>>
  );

  const resources = Array.from(new Set(permissions.map((p) => p.resource)));

  function toggle(role: RoleDefinition, permissionKey: string) {
    if (role.systemRole) return;
    setGrants((prev) => {
      const next = new Set(prev[role.role]);
      if (next.has(permissionKey)) next.delete(permissionKey);
      else next.add(permissionKey);
      return { ...prev, [role.role]: next };
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-sm">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className="border-b border-border-subtle bg-surface-muted px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-muted">
              Permission
            </th>
            {roles.map((r) => (
              <th key={r.role} className="border-b border-border-subtle bg-surface-muted px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                {r.label}
                {r.systemRole && <span className="ml-1 normal-case text-text-muted">(locked)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => (
            <Fragment key={resource}>
              <tr>
                <td colSpan={roles.length + 1} className="border-b border-border-subtle bg-surface-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {resource}
                </td>
              </tr>
              {permissions
                .filter((p) => p.resource === resource)
                .map((permission) => (
                  <tr key={permission.key}>
                    <td className="border-b border-border-subtle px-4 py-3 align-middle text-foreground">
                      <div className="flex flex-col">
                        <span className="font-medium">{permission.label}</span>
                        <span className="text-xs text-text-muted">{permission.description}</span>
                      </div>
                    </td>
                    {roles.map((r) => (
                      <td key={r.role} className="border-b border-border-subtle px-4 py-3 align-middle">
                        <input
                          type="checkbox"
                          checked={grants[r.role].has(permission.key)}
                          disabled={r.systemRole}
                          onChange={() => toggle(r, permission.key)}
                          className="h-4 w-4 accent-brand disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
