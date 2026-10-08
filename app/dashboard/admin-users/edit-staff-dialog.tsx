"use client";

import { useState, useTransition } from "react";

import { TextField } from "../_components/form-field";
import { useToast } from "../_components/toast-provider";
import { updateAdminUserAction } from "./_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { AdminUserRow } from "@/lib/mappers/admin-user.mapper";

/**
 * Correcting a staff member's details: name, email and phone.
 *
 * Role, status and password each have their own menu item and endpoint, so a
 * routine detail edit can never quietly change what an account may do.
 *
 * Changing the phone clears its verified flag on the backend — a number nobody
 * has received a code on does not inherit the trust of the old one — which is
 * why the hint says so rather than leaving it to be discovered.
 */
export function EditStaffDialog({ admin, onClose }: { admin: AdminUserRow; onClose: () => void }) {
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState("");

  const [draft, setDraft] = useState({
    name: admin.name ?? "",
    email: admin.email,
    phone: admin.phone,
  });

  function set(key: keyof typeof draft) {
    return (value: string) => setDraft((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      setErrors({});
      setFailure("");

      const result = await updateAdminUserAction(admin.id, {
        // Blank clears it, and the account falls back to its role label.
        name: draft.name.trim() || null,
        email: draft.email.trim(),
        phone: draft.phone.trim(),
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
        aria-label="Edit staff details"
        className="relative flex max-h-[90vh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="break-words text-base font-semibold text-foreground">Edit details</h2>
          <p className="break-words text-sm text-text-secondary">
            Role, status and password each have their own action.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            id="name"
            label="Full name"
            value={draft.name}
            onChange={set("name")}
            placeholder="Shown instead of the email"
            error={fieldError(errors, "name")}
            disabled={pending}
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            value={draft.email}
            onChange={set("email")}
            error={fieldError(errors, "email")}
            required
            disabled={pending}
          />
          <TextField
            id="phone"
            label="Phone"
            type="tel"
            value={draft.phone}
            onChange={set("phone")}
            hint="This is the number sign-in codes go to. A new number has to be verified again."
            error={fieldError(errors, "phone")}
            required
            disabled={pending}
          />
        </div>

        {failure && (
          <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
            {failure}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
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
            disabled={pending}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:opacity-70"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
