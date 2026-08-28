"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useToast } from "../../_components/toast-provider";
import { composeCommunicationAction, previewAudienceAction } from "../_actions";
import { AudiencePicker } from "./audience-picker";
import type { AudienceCandidateDto } from "@/lib/types/api";
import type { AudiencePreview, CommunicationTemplateRow } from "@/lib/mappers/communication.mapper";
import {
  COMMUNICATION_AUDIENCES,
  COMMUNICATION_AUDIENCE_LABELS,
  COMMUNICATION_CHANNELS,
  COMMUNICATION_CHANNEL_LABELS,
  RIDER_STATUSES,
  VENDOR_STATUSES,
  riderStatusLabels,
  vendorStatusLabels,
  type CommunicationAudience,
  type CommunicationChannel,
} from "@/lib/types/enums";

const SMS_SEGMENT = 160;

const FIELD =
  "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground outline-none transition duration-150 focus:border-brand";
const LABEL = "text-xs font-medium uppercase tracking-wide text-text-muted";

/**
 * Composing a broadcast.
 *
 * Deliberately one form rather than the five-step wizard this replaced: the
 * backend takes a channel, an audience, and a body, and a wizard over three
 * fields was ceremony around a shape that no longer existed.
 *
 * The audience count is fetched as the audience changes, and shown before the
 * send button — SMS is billed per segment, so an admin about to text nine
 * thousand people should see that number while they still have a choice.
 */
export function Composer({ templates }: { templates: CommunicationTemplateRow[] }) {
  const router = useRouter();
  const { showToast, notify } = useToast();
  const [pending, startTransition] = useTransition();

  const [channel, setChannel] = useState<CommunicationChannel>("push");
  const [audience, setAudience] = useState<CommunicationAudience>("customers");
  const [vendorStatus, setVendorStatus] = useState("");
  const [riderStatus, setRiderStatus] = useState("");
  const [people, setPeople] = useState<AudienceCandidateDto[]>([]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const sendsPush = channel === "push" || channel === "both";
  const sendsSms = channel === "sms" || channel === "both";
  // On an SMS-only send there is no body to fall back to, so the SMS field is
  // the message. On a combined send it is a separate, shorter text.
  const smsText = smsBody.trim();
  const segments = smsText.length === 0 ? 0 : Math.ceil(smsText.length / SMS_SEGMENT);

  const filters = () => ({
    vendor_status: vendorStatus || undefined,
    rider_status: riderStatus || undefined,
    user_ids: audience === "custom" ? people.map((person) => person.id) : undefined,
  });

  // Refetch whenever the audience changes. The count is the whole point of the
  // screen having a send button rather than the API having one.
  useEffect(() => {
    let cancelled = false;

    // Debounced, and the loading flag is set inside the timer rather than in
    // the effect body: typing a city should not flash "…" on every keystroke,
    // and a synchronous setState here would re-render before the work starts.
    const timer = setTimeout(() => {
      if (cancelled) return;

      // Inside a transition: see the note in notification-bell.tsx. A Server
      // Action that redirects cannot be applied by the client outside one.
      startTransition(async () => {
        setPreviewing(true);
        const result = await previewAudienceAction({ audience, audience_filters: filters() });

        if (cancelled) return;
        setPreview(result.ok ? result.data : null);
        setPreviewing(false);
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience, vendorStatus, riderStatus, people]);

  const applyTemplate = (id: string) => {
    const template = templates.find((candidate) => String(candidate.id) === id);
    if (!template) return;

    setChannel(template.channel);
    setTitle(template.title);
    setBody(template.body);
    // A template written for push only has no SMS text; fall back to its body
    // so switching the channel afterwards does not leave the field empty.
    setSmsBody(template.smsBody ?? template.body);
  };

  const submit = (mode: "draft" | "schedule" | "now") => {
    if (sendsPush && (title.trim().length === 0 || body.trim().length === 0)) {
      showToast("A push notification needs both a title and a body", "error");
      return;
    }

    if (sendsSms && smsText.length === 0) {
      showToast("Write the SMS text", "error");
      return;
    }

    if (mode === "schedule" && scheduledAt.length === 0) {
      showToast("Pick a date and time to schedule this for", "error");
      return;
    }

    startTransition(async () => {
      const result = await composeCommunicationAction({
        channel,
        audience,
        audience_filters: filters(),
        // The API stores a title and body on every communication, so an
        // SMS-only send derives them from the text rather than saving a
        // record nobody can read back in the history.
        title: sendsPush ? title.trim() : smsText.slice(0, 60),
        body: sendsPush ? body.trim() : smsText,
        sms_body: sendsSms ? smsText : null,
        send_now: mode === "now",
        scheduled_at: mode === "schedule" ? new Date(scheduledAt).toISOString() : null,
      });

      notify(result);
      if (!result.ok) return;

      router.push(`/dashboard/communications/history/${result.data}`);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-6">
        {/* Channel */}
        <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-foreground">Channel</h2>
            <p className="text-xs text-text-muted">
              Push costs nothing. SMS is billed per {SMS_SEGMENT} characters, per person.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {COMMUNICATION_CHANNELS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setChannel(option)}
                className={`flex h-11 items-center justify-center rounded-lg border px-3 text-sm font-medium transition duration-150 ${
                  channel === option
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border-subtle text-text-secondary hover:bg-surface-muted"
                }`}
              >
                {COMMUNICATION_CHANNEL_LABELS[option]}
              </button>
            ))}
          </div>
        </section>

        {/* Audience */}
        <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Audience</h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COMMUNICATION_AUDIENCES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAudience(option)}
                className={`flex h-11 items-center justify-center rounded-lg border px-3 text-sm font-medium transition duration-150 ${
                  audience === option
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border-subtle text-text-secondary hover:bg-surface-muted"
                }`}
              >
                {COMMUNICATION_AUDIENCE_LABELS[option]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(audience === "vendors" || audience === "all") && (
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Vendor status</span>
                <select
                  value={vendorStatus}
                  onChange={(event) => setVendorStatus(event.target.value)}
                  className={FIELD}
                >
                  <option value="">Any status</option>
                  {VENDOR_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {vendorStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {(audience === "riders" || audience === "all") && (
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Rider status</span>
                <select
                  value={riderStatus}
                  onChange={(event) => setRiderStatus(event.target.value)}
                  className={FIELD}
                >
                  <option value="">Any status</option>
                  {RIDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {riderStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {audience === "custom" && (
            <AudiencePicker
              selected={people}
              onChange={setPeople}
              warnWithoutDevice={sendsPush}
            />
          )}
        </section>

        {/* Content. What is asked for depends on the channel: an SMS has no
            title, so showing one and then not sending it is a lie. */}
        <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-foreground">Message</h2>
            <p className="text-xs text-text-muted">
              {channel === "sms"
                ? "An SMS is one block of text. There is no title and no image."
                : channel === "push"
                  ? "A push notification is a title and a short body."
                  : "The push carries the title and body. The SMS is written separately, because it is billed by the character."}
            </p>
          </div>

          {sendsPush && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>{channel === "both" ? "Push title" : "Title"}</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  placeholder="Free delivery this weekend"
                  className={FIELD}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>{channel === "both" ? "Push body" : "Body"}</span>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="No delivery fee on any order this Saturday and Sunday."
                  className="w-full rounded-lg border border-border-subtle bg-surface p-3 text-sm text-foreground outline-none transition duration-150 focus:border-brand"
                />
                <span className="text-xs text-text-muted">{body.length} / 1000</span>
              </label>
            </>
          )}

          {sendsSms && (
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>{channel === "both" ? "SMS text" : "Message"}</span>
              <textarea
                value={smsBody}
                onChange={(event) => setSmsBody(event.target.value)}
                rows={3}
                maxLength={320}
                placeholder="BagyesRUSH: free delivery on every order this weekend."
                className="w-full rounded-lg border border-border-subtle bg-surface p-3 text-sm text-foreground outline-none transition duration-150 focus:border-brand"
              />
              <span className="text-xs text-text-muted">
                {smsBody.length} / 320 characters — {segments} segment{segments === 1 ? "" : "s"}{" "}
                per recipient
              </span>
            </label>
          )}
        </section>

        {/* Timing */}
        <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Timing</h2>

          <label className="flex flex-col gap-1.5 sm:max-w-xs">
            <span className={LABEL}>Schedule for</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className={FIELD}
            />
          </label>
        </section>
      </div>

      {/* The blast radius, before spending it */}
      <aside className="flex h-fit flex-col gap-5 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm xl:sticky xl:top-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-foreground">This will reach</h2>
          <p className="text-xs text-text-muted">{preview?.audienceLabel ?? "—"}</p>
        </div>

        <p className="text-4xl font-semibold tabular-nums text-foreground">
          {previewing ? "…" : (preview?.recipients.toLocaleString() ?? "—")}
        </p>

        <dl className="flex flex-col gap-2 border-t border-border-subtle pt-4 text-sm">
          {sendsPush && (
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Reachable by push</dt>
              <dd className="tabular-nums text-foreground">
                {preview?.reachableByPush.toLocaleString() ?? "—"}
              </dd>
            </div>
          )}
          {sendsSms && (
            <>
              <div className="flex items-center justify-between">
                <dt className="text-text-secondary">Reachable by SMS</dt>
                <dd className="tabular-nums text-foreground">
                  {preview?.reachableBySms.toLocaleString() ?? "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-secondary">SMS segments</dt>
                <dd className="tabular-nums text-foreground">
                  {preview ? (preview.reachableBySms * segments).toLocaleString() : "—"}
                </dd>
              </div>
            </>
          )}
        </dl>

        {sendsPush && preview && preview.recipients > preview.reachableByPush && (
          <p className="rounded-lg bg-status-warning/10 p-3 text-xs text-status-warning">
            {(preview.recipients - preview.reachableByPush).toLocaleString()} of these have never
            opened the app, so a push will not reach them.
          </p>
        )}

        {templates.length > 0 && (
          <label className="flex flex-col gap-1.5 border-t border-border-subtle pt-4">
            <span className={LABEL}>Start from a template</span>
            <select
              defaultValue=""
              onChange={(event) => applyTemplate(event.target.value)}
              className={FIELD}
            >
              <option value="">None</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
          <button
            type="button"
            onClick={() => submit("now")}
            disabled={pending}
            className="flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Working…" : "Send now"}
          </button>
          <button
            type="button"
            onClick={() => submit("schedule")}
            disabled={pending || scheduledAt.length === 0}
            className="flex h-11 items-center justify-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Schedule
          </button>
          <button
            type="button"
            onClick={() => submit("draft")}
            disabled={pending}
            className="flex h-11 items-center justify-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save as draft
          </button>
        </div>
      </aside>
    </div>
  );
}
