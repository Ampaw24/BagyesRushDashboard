"use client";

import { Fragment, useMemo, useState } from "react";

import { useToast } from "../../_components/toast-provider";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import {
  resetRolePermissionsAction,
  syncRoleDefaultsAction,
  updateRolePermissionsAction,
} from "./_actions";
import type { ManagedRoleDto, ManagedRolesResponseDto } from "@/lib/types/api";
import type { AdminRole, Permission } from "@/lib/types/enums";

const HEAD_CELL =
  "border-b border-border-subtle bg-surface-muted px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-muted";

/**
 * Role → permission matrix, editable in place.
 *
 * Two things this screen has to be honest about:
 *
 * Super admin's column is locked. It always resolves to every permission there
 * is, including ones added after today, and an editable super admin is one
 * mis-click away from nobody being able to reach this page.
 *
 * A role that has never been edited resolves through the enum defaults in code,
 * so it picks up new modules automatically. Editing one freezes it — which is
 * why "Sync defaults" exists, and why a frozen role missing something its
 * baseline has is called out rather than left to be noticed.
 */
export function RolesMatrix({ roles, permissions }: ManagedRolesResponseDto) {
  const { notify } = useToast();
  const groups = Object.entries(permissions);

  // Local edits, keyed by role. A role absent from here is unedited.
  const [draft, setDraft] = useState<Partial<Record<AdminRole, Set<Permission>>>>({});
  const [saving, setSaving] = useState<AdminRole | null>(null);
  const [resetting, setResetting] = useState<ManagedRoleDto | null>(null);
  const [syncing, setSyncing] = useState(false);

  const held = useMemo(() => {
    const map = new Map<AdminRole, Set<Permission>>();
    for (const role of roles) {
      map.set(role.value, draft[role.value] ?? new Set(role.permissions));
    }
    return map;
  }, [roles, draft]);

  const isDirty = (role: ManagedRoleDto) => {
    const current = draft[role.value];
    if (!current) return false;

    return (
      current.size !== role.permissions.length ||
      role.permissions.some((permission) => !current.has(permission))
    );
  };

  const toggle = (role: ManagedRoleDto, permission: Permission) => {
    if (!role.is_editable) return;

    setDraft((previous) => {
      const next = new Set(previous[role.value] ?? role.permissions);
      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }

      return { ...previous, [role.value]: next };
    });
  };

  const toggleGroup = (role: ManagedRoleDto, entries: Permission[], on: boolean) => {
    if (!role.is_editable) return;

    setDraft((previous) => {
      const next = new Set(previous[role.value] ?? role.permissions);
      for (const permission of entries) {
        if (on) {
          next.add(permission);
        } else {
          next.delete(permission);
        }
      }

      return { ...previous, [role.value]: next };
    });
  };

  const save = async (role: ManagedRoleDto) => {
    setSaving(role.value);

    const result = await updateRolePermissionsAction(
      role.value,
      Array.from(held.get(role.value) ?? new Set<Permission>()),
    );

    setSaving(null);
    notify(result);

    if (result.ok) {
      // Drop the local copy so the server's answer becomes the truth.
      setDraft((previous) => {
        const next = { ...previous };
        delete next[role.value];
        return next;
      });
    }
  };

  const discard = (role: ManagedRoleDto) => {
    setDraft((previous) => {
      const next = { ...previous };
      delete next[role.value];
      return next;
    });
  };

  const sync = async () => {
    setSyncing(true);
    const result = await syncRoleDefaultsAction();
    setSyncing(false);
    notify(result);
  };

  const behindDefaults = roles.filter((role) => role.missing_from_default.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {behindDefaults.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-status-warning/30 bg-status-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground">
            {behindDefaults.map((role) => role.label).join(", ")}{" "}
            {behindDefaults.length === 1 ? "is" : "are"} missing permissions their defaults include —
            usually a module that shipped after the role was last edited.
          </p>
          <button
            type="button"
            onClick={sync}
            disabled={syncing}
            className="h-10 shrink-0 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {syncing ? "Syncing…" : "Grant the missing ones"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <caption className="sr-only">Permissions granted by each administrator role</caption>
          <thead>
            <tr>
              <th scope="col" className={HEAD_CELL}>
                Permission
              </th>
              {roles.map((role) => (
                <th key={role.value} scope="col" className={`${HEAD_CELL} text-center`}>
                  <span className="flex flex-col items-center gap-1">
                    <span>{role.label}</span>
                    {!role.is_editable && (
                      <span className="font-normal normal-case tracking-normal text-text-muted">
                        always all
                      </span>
                    )}
                    {role.is_editable && role.is_customised && (
                      <span className="font-normal normal-case tracking-normal text-status-info">
                        customised
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([group, entries]) => {
              const values = entries.map((entry) => entry.value);

              return (
                <Fragment key={group}>
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={roles.length + 1}
                      className="border-b border-border-subtle bg-surface-muted px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary"
                    >
                      {group}
                    </th>
                  </tr>

                  {entries.map((entry) => (
                    <tr key={entry.value} className="transition duration-150 hover:bg-surface-muted">
                      <td className="border-b border-border-subtle px-4 py-3">
                        <span className="flex flex-col gap-0.5">
                          <span className="text-foreground">{entry.label}</span>
                          <code className="text-xs text-text-muted">{entry.value}</code>
                        </span>
                      </td>

                      {roles.map((role) => {
                        const checked = held.get(role.value)?.has(entry.value) ?? false;

                        return (
                          <td
                            key={role.value}
                            className="border-b border-border-subtle px-4 py-3 text-center"
                          >
                            <input
                              type="checkbox"
                              checked={role.is_editable ? checked : true}
                              disabled={!role.is_editable || saving === role.value}
                              onChange={() => toggle(role, entry.value)}
                              aria-label={`${entry.label} for ${role.label}`}
                              className="h-4 w-4 rounded border-border-subtle accent-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  <tr>
                    <td className="border-b border-border-subtle px-4 py-2 text-xs text-text-muted">
                      Whole section
                    </td>
                    {roles.map((role) => (
                      <td
                        key={role.value}
                        className="border-b border-border-subtle px-4 py-2 text-center"
                      >
                        {role.is_editable && (
                          <span className="flex items-center justify-center gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => toggleGroup(role, values, true)}
                              className="text-text-muted transition duration-150 hover:text-brand"
                            >
                              All
                            </button>
                            <span className="text-border-subtle">|</span>
                            <button
                              type="button"
                              onClick={() => toggleGroup(role, values, false)}
                              className="text-text-muted transition duration-150 hover:text-brand"
                            >
                              None
                            </button>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {roles.map((role) => {
          const dirty = isDirty(role);

          return (
            <div
              key={role.value}
              className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm"
            >
              <span className="text-sm font-semibold text-foreground">{role.label}</span>
              <span className="text-xs text-text-muted">
                {role.is_editable
                  ? `${(held.get(role.value)?.size ?? 0).toLocaleString()} of ${Object.values(permissions).flat().length} permissions`
                  : "Every permission, always"}
              </span>

              {role.is_editable && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => save(role)}
                    disabled={!dirty || saving === role.value}
                    className="h-9 rounded-lg bg-brand px-3 text-xs font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving === role.value ? "Saving…" : "Save"}
                  </button>

                  {dirty && (
                    <button
                      type="button"
                      onClick={() => discard(role)}
                      className="h-9 rounded-lg border border-border-subtle px-3 text-xs font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
                    >
                      Discard
                    </button>
                  )}

                  {role.is_customised && !dirty && (
                    <button
                      type="button"
                      onClick={() => setResetting(role)}
                      className="h-9 rounded-lg border border-border-subtle px-3 text-xs font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
                    >
                      Reset to default
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {resetting && (
        <ConfirmDialog
          title={`Reset ${resetting.label}?`}
          description="It goes back to the permissions it ships with, and starts picking up new modules automatically again. Anything granted by hand is lost."
          confirmLabel="Reset"
          onCancel={() => setResetting(null)}
          onConfirm={async () => {
            const result = await resetRolePermissionsAction(resetting.value);
            if (result.ok) {
              discard(resetting);
              setResetting(null);
            }

            return { ok: result.ok, message: result.message };
          }}
        />
      )}
    </div>
  );
}
