"use client";

import { useState, useTransition, type FormEvent } from "react";

import { useToast } from "../_components/toast-provider";
import { changePasswordAction } from "./_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";

const FIELD =
  "h-11 w-full max-w-sm rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60";
const LABEL = "text-sm font-medium text-text-secondary";

/**
 * Changing your own password.
 *
 * The backend enforces the two rules that matter — the current password has to
 * be right, and the new one has to be different — and both arrive as field
 * errors, so they are rendered against the input rather than flattened into one
 * banner. The only check duplicated here is the confirmation match, because
 * catching that before a round trip costs nothing.
 */
export function ChangePasswordForm() {
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [localError, setLocalError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (password !== confirmation) {
      setLocalError("The two passwords do not match.");
      return;
    }

    startTransition(async () => {
      setErrors({});
      setLocalError("");

      const result = await changePasswordAction({
        current_password: currentPassword,
        password,
        password_confirmation: confirmation,
      });

      notify(result);

      if (result.ok) {
        setCurrentPassword("");
        setPassword("");
        setConfirmation("");
        return;
      }

      setErrors(result.errors);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h2 className="break-words text-sm font-semibold text-foreground">Change password</h2>
        <p className="break-words text-sm text-text-muted">
          Your other devices are signed out when the password changes. This session stays open.
        </p>
      </div>

      <Field
        id="current_password"
        label="Current password"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
        error={fieldError(errors, "current_password")}
        disabled={pending}
      />

      <Field
        id="password"
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint="At least 8 characters, and different from the current one."
        error={fieldError(errors, "password")}
        disabled={pending}
      />

      <Field
        id="password_confirmation"
        label="Confirm new password"
        value={confirmation}
        onChange={setConfirmation}
        autoComplete="new-password"
        error={localError || undefined}
        disabled={pending}
      />

      <div>
        <button
          type="submit"
          disabled={pending || !currentPassword || !password}
          className="flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
  error,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  hint?: string;
  error?: string;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="password"
        autoComplete={autoComplete}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD}
      />
      {error ? (
        <p className="break-words text-xs text-status-critical">{error}</p>
      ) : hint ? (
        <p className="break-words text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
