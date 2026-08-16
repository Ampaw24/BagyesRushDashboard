"use client";

import { useState, type ReactNode } from "react";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  /** Minimum reason length the backend enforces (5 for accounts, 10 for vendors). */
  reasonMinLength?: number;
  /**
   * May return a promise. If it rejects, or resolves to `{ ok: false }`, the
   * dialog stays open and shows the message instead of closing on a failure.
   */
  onConfirm: (reason?: string) => void | Promise<void | ConfirmOutcome>;
  onCancel: () => void;
  children?: ReactNode;
};

/** What an action reports back so the dialog knows whether it actually worked. */
export type ConfirmOutcome = { ok: boolean; message?: string };

// Render this conditionally (`{open && <ConfirmDialog ... />}`) rather than
// passing an `open` prop — each open should be a fresh mount so the reason
// textarea doesn't carry over stale text from a previous confirmation.
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  requireReason = false,
  reasonLabel = "Reason",
  reasonMinLength = 1,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const reasonTooShort = requireReason && reason.trim().length < reasonMinLength;
  const canConfirm = !reasonTooShort && !pending;

  async function handleConfirm() {
    setPending(true);
    setError("");

    try {
      const outcome = await onConfirm(requireReason ? reason.trim() : undefined);
      // A rejected action leaves the dialog open so the admin can read why and
      // retry — closing on failure would look like the change had been saved.
      if (outcome && outcome.ok === false) {
        setError(outcome.message ?? "The action could not be completed.");
        setPending(false);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The action could not be completed.");
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={pending ? undefined : onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex w-full max-w-md flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="break-words text-base font-semibold text-foreground">{title}</h2>
          <p className="break-words text-sm text-text-secondary">{description}</p>
        </div>

        {children}

        {requireReason && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-reason" className="text-sm font-medium text-text-secondary">
              {reasonLabel}
            </label>
            <textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={pending}
              className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
            />
            {reasonMinLength > 1 && (
              <p className="text-xs text-text-muted">
                At least {reasonMinLength} characters. This is recorded in the audit log.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`flex h-11 items-center rounded-lg px-5 text-sm font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-70 ${
              danger ? "bg-status-critical text-white hover:opacity-90" : "bg-brand text-brand-foreground hover:bg-brand-dark"
            }`}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
