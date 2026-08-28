"use client";

import { useState } from "react";

import { useToast } from "../../_components/toast-provider";
import { updateReportStatusAction } from "../_actions";
import { REPORT_STATUS_LABELS, type ReportStatus } from "@/lib/types/enums";

/** Closing a complaint requires a note — it is what the reporter is shown. */
const CLOSING: ReportStatus[] = ["resolved", "dismissed"];

const MIN_NOTE = 10;

export function ReportTriage({
  reportId,
  status,
}: {
  reportId: number;
  status: ReportStatus;
}) {
  const { notify } = useToast();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<ReportStatus | null>(null);
  const [error, setError] = useState("");

  const submit = async (target: ReportStatus) => {
    if (CLOSING.includes(target) && note.trim().length < MIN_NOTE) {
      setError(`Write at least ${MIN_NOTE} characters — the reporter is shown this.`);
      return;
    }

    setError("");
    setPending(target);

    const result = await updateReportStatusAction(reportId, {
      status: target,
      resolution_note: CLOSING.includes(target) ? note.trim() : null,
    });

    setPending(null);
    notify(result);

    if (result.ok) setNote("");
  };

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">Triage</h2>
        <p className="text-xs text-text-muted">
          The reporter is notified on every change, and shown the note.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          Note to the reporter
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="We spoke to the vendor and they have refunded the item."
          className="w-full rounded-lg border border-border-subtle bg-surface p-3 text-sm text-foreground outline-none transition duration-150 focus:border-brand"
        />
      </label>

      {error && <p className="text-xs text-status-critical">{error}</p>}

      <div className="flex flex-col gap-2">
        {status === "pending" && (
          <button
            type="button"
            onClick={() => submit("in_review")}
            disabled={pending !== null}
            className="flex h-11 items-center justify-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending === "in_review" ? "Working…" : REPORT_STATUS_LABELS.in_review}
          </button>
        )}

        <button
          type="button"
          onClick={() => submit("resolved")}
          disabled={pending !== null}
          className="flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending === "resolved" ? "Working…" : "Resolve"}
        </button>

        <button
          type="button"
          onClick={() => submit("dismissed")}
          disabled={pending !== null}
          className="flex h-11 items-center justify-center rounded-lg border border-status-critical/30 px-5 text-sm font-medium text-status-critical transition duration-150 hover:bg-status-critical/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending === "dismissed" ? "Working…" : "Dismiss"}
        </button>
      </div>
    </section>
  );
}
