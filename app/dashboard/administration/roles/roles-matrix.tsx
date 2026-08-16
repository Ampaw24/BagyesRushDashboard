import { Fragment } from "react";

import type { RolesResponseDto } from "@/lib/types/api";

/**
 * Read-only role → permission matrix.
 *
 * The checkboxes are gone: roles are a PHP enum (app/Enums/AdminRole.php), not
 * database rows, so there is no endpoint that could persist a change. Showing
 * an editable grid that silently discarded edits would be worse than showing
 * the truth.
 */
export function RolesMatrix({ roles, permissions }: RolesResponseDto) {
  const groups = Object.entries(permissions);

  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-sm">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">Permissions granted by each administrator role</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="border-b border-border-subtle bg-surface-muted px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              Permission
            </th>
            {roles.map((role) => (
              <th
                key={role.value}
                scope="col"
                className="border-b border-border-subtle bg-surface-muted px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-muted"
              >
                {role.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(([group, entries]) => (
            <Fragment key={group}>
              <tr>
                <td
                  colSpan={roles.length + 1}
                  className="border-b border-border-subtle bg-surface-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary"
                >
                  {group}
                </td>
              </tr>
              {entries.map((permission) => (
                <tr key={permission.value}>
                  <th
                    scope="row"
                    className="border-b border-border-subtle px-4 py-3 text-left align-middle font-normal text-foreground"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{permission.label}</span>
                      <code className="text-xs text-text-muted">{permission.value}</code>
                    </span>
                  </th>
                  {roles.map((role) => {
                    const granted = role.permissions.includes(permission.value);
                    return (
                      <td key={role.value} className="border-b border-border-subtle px-4 py-3 align-middle">
                        <span
                          aria-label={granted ? "Granted" : "Not granted"}
                          className={granted ? "text-status-good" : "text-text-muted"}
                        >
                          {granted ? "✓" : "—"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
