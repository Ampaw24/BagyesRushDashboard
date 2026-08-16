"use client";

import { useState, type FormEvent } from "react";

import { createStaffAction } from "./_actions";
import { useToast } from "../_components/toast-provider";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import { ADMIN_ROLES, adminRoleLabels, type AdminRole } from "@/lib/types/enums";

/**
 * Creates a staff account.
 *
 * `POST /admin/users` only ever makes administrators — public registration is
 * the only path to a customer or vendor. The response carries a one-time
 * password that is shown here and never again.
 */
export function NewStaffDialog({ onClose }: { onClose: () => void }) {
  const [pending, setPending] = useState(false);
  const { notifySuccess } = useToast();
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();

    setPending(true);
    setMessage("");
    setErrors({});

    const result = await createStaffAction({
      email,
      phone: String(form.get("phone") ?? "").trim(),
      // Omitted when blank so the backend generates one.
      ...(password ? { password } : {}),
      admin_role: String(form.get("admin_role") ?? "support") as AdminRole,
    });

    setPending(false);
    notifySuccess(result);

    if (result.ok) {
      setCreated({ email, password: result.data.password });
      return;
    }

    setMessage(result.message);
    setErrors(result.errors);
  }

  if (created) {
    return (
      <Shell label="Staff account created" onClose={onClose}>
        <h2 className="break-words text-base font-semibold text-foreground">Staff account created</h2>
        <p className="break-words text-sm text-text-secondary">
          Share this password with {created.email} now — it is not stored anywhere and cannot be
          shown again.
        </p>
        <output className="break-all rounded-lg border border-border-subtle bg-surface-muted px-4 py-3 font-mono text-sm text-foreground">
          {created.password}
        </output>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            Done
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell label="New staff account" onClose={pending ? undefined : onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="break-words text-base font-semibold text-foreground">New staff account</h2>

        <Field label="Email" error={fieldError(errors, "email")}>
          <input name="email" type="email" required className={inputClass} />
        </Field>

        <Field label="Phone" error={fieldError(errors, "phone")}>
          <input name="phone" type="tel" required className={inputClass} />
        </Field>

        <Field label="Password (optional)" error={fieldError(errors, "password")}>
          <input
            name="password"
            type="text"
            minLength={8}
            placeholder="Generated if left blank"
            className={inputClass}
          />
        </Field>

        <Field label="Role" error={fieldError(errors, "admin_role")}>
          <select name="admin_role" defaultValue="support" className={inputClass}>
            {ADMIN_ROLES.map((role) => (
              <option key={role} value={role}>
                {adminRoleLabels[role]}
              </option>
            ))}
          </select>
        </Field>

        {message && (
          <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
            {message}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:opacity-70"
          >
            {pending ? "Creating…" : "Create account"}
          </button>
        </div>
      </form>
    </Shell>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";

function Shell({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      {children}
      {error && <p className="break-words text-xs text-status-critical">{error}</p>}
    </div>
  );
}
