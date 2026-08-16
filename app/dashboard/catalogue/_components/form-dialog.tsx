"use client";

import type { FormEvent, ReactNode } from "react";

/** Shared input styling, so the catalogue forms match the rest of the dashboard. */
export const inputClass =
  "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";

export const textareaClass =
  "w-full resize-y rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";

/**
 * Modal shell for the catalogue create/edit forms.
 *
 * Rendered conditionally (`{open && <FormDialog … />}`) so each open is a fresh
 * mount and no stale field values survive from a previous edit.
 */
export function FormDialog({
  title,
  submitLabel,
  pending,
  message,
  onSubmit,
  onClose,
  children,
}: {
  title: string;
  submitLabel: string;
  pending: boolean;
  /** Top-level error from the API, shown above the buttons. */
  message?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={pending ? undefined : onClose} />
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <h2 className="break-words text-base font-semibold text-foreground">{title}</h2>

        {children}

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
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      {children}
      {hint && !error && <p className="break-words text-xs text-text-muted">{hint}</p>}
      {error && <p className="break-words text-xs text-status-critical">{error}</p>}
    </div>
  );
}

/** Checkbox row with a 44px touch target, per the project's mobile rules. */
export function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm text-text-secondary">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border-subtle text-brand focus:ring-brand"
      />
      {label}
    </label>
  );
}
