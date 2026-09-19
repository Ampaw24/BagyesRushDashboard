"use client";

import { useState, useTransition } from "react";

import { useToast } from "./toast-provider";
import { messageUserAction } from "../_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_CHANNEL_LABELS,
  type CommunicationChannel,
} from "@/lib/types/enums";

/** The length one SMS segment holds; past it, a message is billed as two. */
const SMS_SEGMENT = 160;

const FIELD =
  "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60";
const LABEL = "text-xs font-medium uppercase tracking-wide text-text-muted";

export type MessageRecipient = {
  /** The **user** id — a customer, vendor or rider id will not do. */
  userId: number;
  /** Shown in the heading, so the admin can see who they are about to text. */
  name: string;
  /** Shown under the heading when the channel includes SMS. */
  phone?: string | null;
};

/**
 * One message to one person, push and/or SMS.
 *
 * The bulk composer already existed; this is the same thing scoped to a single
 * recipient, and it deliberately posts to the same endpoint so a reply to one
 * vendor appears in the same communications history as a blast to nine
 * thousand. Support answering "did anyone get back to this rider" has one place
 * to look.
 *
 * The segment counter is the part worth keeping: SMS is billed per segment, so
 * an admin writing 170 characters should see that it costs two before they send
 * it.
 */
export function SendMessageDialog({
  recipient,
  onClose,
}: {
  recipient: MessageRecipient;
  onClose: () => void;
}) {
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();

  const [channel, setChannel] = useState<CommunicationChannel>("push");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState("");

  const sendsPush = channel === "push" || channel === "both";
  const sendsSms = channel === "sms" || channel === "both";

  const smsText = smsBody.trim();
  const segments = smsText.length === 0 ? 0 : Math.ceil(smsText.length / SMS_SEGMENT);

  // On an SMS-only send there is no push body to fall back on, so the SMS text
  // is the message and has to be there.
  const canSend =
    !pending && title.trim().length > 0 && body.trim().length > 0 && (!sendsSms || smsText.length > 0);

  function handleSend() {
    startTransition(async () => {
      setErrors({});
      setFailure("");

      const result = await messageUserAction(recipient.userId, {
        channel,
        title: title.trim(),
        body: body.trim(),
        sms_body: sendsSms ? smsText : null,
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
        aria-label={`Message ${recipient.name}`}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="break-words text-base font-semibold text-foreground">
            Message {recipient.name}
          </h2>
          <p className="break-words text-sm text-text-secondary">
            {sendsSms && recipient.phone
              ? `Texts go to ${recipient.phone}. This is recorded in the communications history.`
              : "Recorded in the communications history, the same as a broadcast."}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Channel</span>
          <div className="flex flex-wrap gap-2">
            {COMMUNICATION_CHANNELS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setChannel(option)}
                disabled={pending}
                className={`flex min-h-10 items-center rounded-lg border px-3 text-sm font-medium transition duration-150 disabled:opacity-60 ${
                  channel === option
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border-subtle text-text-secondary hover:bg-surface-muted"
                }`}
              >
                {COMMUNICATION_CHANNEL_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="message-title" className={LABEL}>
            Title
          </label>
          <input
            id="message-title"
            value={title}
            disabled={pending}
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="About your order"
            className={FIELD}
          />
          {fieldError(errors, "title") && (
            <p className="break-words text-xs text-status-critical">{fieldError(errors, "title")}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="message-body" className={LABEL}>
            {sendsPush ? "Message" : "Message (kept on record)"}
          </label>
          <textarea
            id="message-body"
            value={body}
            disabled={pending}
            maxLength={1000}
            rows={4}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What do you need them to know?"
            className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
          />
          {fieldError(errors, "body") && (
            <p className="break-words text-xs text-status-critical">{fieldError(errors, "body")}</p>
          )}
        </div>

        {sendsSms && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="message-sms" className={LABEL}>
              SMS text
            </label>
            <textarea
              id="message-sms"
              value={smsBody}
              disabled={pending}
              maxLength={320}
              rows={3}
              onChange={(event) => setSmsBody(event.target.value)}
              placeholder="Shorter than the push message — this is what is texted."
              className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
            />
            <p className="break-words text-xs text-text-muted">
              {smsText.length}/320 characters
              {segments > 0 && ` · ${segments} SMS segment${segments === 1 ? "" : "s"}, billed per segment`}
            </p>
            {fieldError(errors, "sms_body") && (
              <p className="break-words text-xs text-status-critical">{fieldError(errors, "sms_body")}</p>
            )}
          </div>
        )}

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
            onClick={handleSend}
            disabled={!canSend}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Sending…" : "Send message"}
          </button>
        </div>
      </div>
    </div>
  );
}
