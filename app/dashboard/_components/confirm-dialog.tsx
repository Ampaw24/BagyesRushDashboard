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
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  children?: ReactNode;
};

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
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const canConfirm = !requireReason || reason.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
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
              className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(requireReason ? reason : undefined)}
            disabled={!canConfirm}
            className={`flex h-11 items-center rounded-lg px-5 text-sm font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-70 ${
              danger ? "bg-status-critical text-white hover:opacity-90" : "bg-brand text-brand-foreground hover:bg-brand-dark"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
