"use client";

import { useState, useTransition } from "react";

import { TextAreaField, TextField } from "../../_components/form-field";
import { useToast } from "../../_components/toast-provider";
import { createRoleAction, updateRoleAction } from "./_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { ManagedRoleDto, ManagedRolesResponseDto } from "@/lib/types/api";
import type { Permission } from "@/lib/types/enums";

/**
 * Creating a staff role, or renaming one created here earlier.
 *
 * On create the permissions are ticked in the same form, so the role can be
 * handed to somebody the moment it exists. On rename they are not shown: what
 * a role may do is edited in the matrix, the one place that edits it for every
 * role, built in or not.
 */
export function RoleDialog({
  role,
  permissions,
  onClose,
}: {
  /** The role being renamed, or undefined to create one. */
  role?: ManagedRoleDto;
  permissions: ManagedRolesResponseDto["permissions"];
  onClose: () => void;
}) {
  const creating = role === undefined;
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState("");

  const [name, setName] = useState(role?.label ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [granted, setGranted] = useState<Set<Permission>>(new Set());

  const toggle = (permission: Permission) =>
    setGranted((previous) => {
      const next = new Set(previous);
      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }
      return next;
    });

  const toggleGroup = (values: Permission[], on: boolean) =>
    setGranted((previous) => {
      const next = new Set(previous);
      for (const value of values) {
        if (on) {
          next.add(value);
        } else {
          next.delete(value);
        }
      }
      return next;
    });

  function save() {
    startTransition(async () => {
      setErrors({});
      setFailure("");

      const result = creating
        ? await createRoleAction({
            name: name.trim(),
            ...(description.trim() ? { description: description.trim() } : {}),
            permissions: Array.from(granted),
          })
        : await updateRoleAction(role.value, {
            name: name.trim(),
            description: description.trim() || null,
          });

      notify(result);

      if (result.ok) {
        onClose();
        return;
      }

      setErrors(result.errors);
      setFailure(result.message);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={pending ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={creating ? "New role" : `Rename ${role.label}`}
        className={`relative flex max-h-[90vh] w-full flex-col rounded-xl border border-border-subtle bg-surface shadow-sm ${creating ? "max-w-2xl" : "max-w-md"}`}
      >
        <div className="flex shrink-0 flex-col gap-1.5 border-b border-border-subtle p-6 pb-4">
          <h2 className="break-words text-base font-semibold text-foreground">
            {creating ? "New role" : `Rename ${role.label}`}
          </h2>
          <p className="break-words text-sm text-text-secondary">
            {creating
              ? "Name the role and tick what it may do. You can assign it to staff straight away, and change its permissions later in the matrix."
              : "Everyone who holds this role keeps it. Permissions are edited in the matrix."}
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          <TextField
            id="role_name"
            label="Name"
            value={name}
            onChange={setName}
            placeholder="e.g. Dispatcher"
            error={fieldError(errors, "name")}
            required
            disabled={pending}
          />
          <TextAreaField
            id="role_description"
            label="Description"
            value={description}
            onChange={setDescription}
            rows={2}
            placeholder="What this person does, so whoever assigns the role knows"
            error={fieldError(errors, "description")}
            disabled={pending}
          />

          {creating && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Permissions
                </span>
                <span className="text-xs text-text-muted">
                  {granted.size} of {Object.values(permissions).flat().length} selected
                </span>
              </div>
              {fieldError(errors, "permissions") && (
                <p className="break-words text-xs text-status-critical">
                  {fieldError(errors, "permissions")}
                </p>
              )}

              {Object.entries(permissions).map(([group, entries]) => {
                const values = entries.map((entry) => entry.value);
                const all = values.every((value) => granted.has(value));

                return (
                  <fieldset
                    key={group}
                    className="flex flex-col gap-2 rounded-lg border border-border-subtle p-3"
                  >
                    <legend className="flex w-full items-center justify-between gap-2 px-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        {group}
                      </span>
                    </legend>
                    <button
                      type="button"
                      onClick={() => toggleGroup(values, !all)}
                      disabled={pending}
                      className="self-start text-xs text-text-muted transition duration-150 hover:text-brand"
                    >
                      {all ? "Clear section" : "Select section"}
                    </button>
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {entries.map((entry) => (
                        <label
                          key={entry.value}
                          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-foreground transition duration-150 hover:bg-surface-muted"
                        >
                          <input
                            type="checkbox"
                            checked={granted.has(entry.value)}
                            onChange={() => toggle(entry.value)}
                            disabled={pending}
                            className="h-4 w-4 shrink-0 rounded border-border-subtle accent-[var(--brand)]"
                          />
                          <span className="break-words">{entry.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          )}

          {failure && (
            <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
              {failure}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border-subtle p-6 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending || name.trim() === ""}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:opacity-70"
          >
            {pending ? "Saving…" : creating ? "Create role" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
