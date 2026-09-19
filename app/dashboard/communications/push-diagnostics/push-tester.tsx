"use client";

import { useState } from "react";

import { useToast } from "../../_components/toast-provider";
import { AudiencePicker } from "../_components/audience-picker";
import { sendTestPushAction } from "../_actions";
import type { AudienceCandidateDto, TestPushResultDto } from "@/lib/types/api";

const MODES = [
  {
    value: "both",
    label: "Both",
    hint: "What this application actually sends. Start here.",
  },
  {
    value: "notification",
    label: "Notification only",
    hint: "What the Firebase console composes. The OS draws it even when the app is closed.",
  },
  {
    value: "data",
    label: "Data only",
    hint: "What a foregrounded Flutter app receives. Nothing is drawn unless the app draws it.",
  },
] as const;

const inputClass =
  "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground transition duration-150 focus:border-brand focus:outline-none";

/**
 * Sends one push and shows exactly what Firebase said back.
 *
 * The question this answers is the one the Firebase console cannot: FCM counts
 * a message as delivered the moment it accepts it, so a handset that rendered
 * nothing looks identical to one that rendered correctly. Splitting the send
 * into `notification` and `data` is what turns "push is broken" into something
 * narrower — a push that arrives as notification-only but not as data is an app
 * handler problem, not a credentials problem.
 */
export function PushTester() {
  const [target, setTarget] = useState<"user" | "token">("user");
  const [person, setPerson] = useState<AudienceCandidateDto[]>([]);
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]["value"]>("both");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TestPushResultDto | null>(null);
  const { notify } = useToast();

  async function send() {
    setBusy(true);
    setResult(null);

    const outcome = await sendTestPushAction({
      ...(target === "user" ? { user_id: person[0].id } : { token: token.trim() }),
      title: title.trim() || undefined,
      body: body.trim() || undefined,
      mode,
    });

    setBusy(false);
    notify(outcome);

    if (outcome.ok) setResult(outcome.data);
  }

  const ready = target === "user" ? person.length > 0 : token.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Send to
          </span>
          <div className="flex flex-wrap gap-2">
            {(["user", "token"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTarget(option)}
                className={`flex h-9 items-center rounded-full px-3.5 text-sm font-medium transition duration-150 ${
                  target === option
                    ? "bg-brand text-brand-foreground"
                    : "bg-surface-muted text-text-secondary hover:bg-border-subtle"
                }`}
              >
                {option === "user" ? "A user's devices" : "One raw token"}
              </button>
            ))}
          </div>
          <span className="text-xs text-text-muted">
            {target === "user"
              ? "Every device that person has registered. Fails clearly if they have none."
              : "Paste a token straight off a handset — useful before an account even exists."}
          </span>
        </div>

        {target === "user" ? (
          <AudiencePicker
            selected={person}
            onChange={setPerson}
            single
            // The most useful fact on this screen: "no device" means they have
            // never opened the app on a phone that registered a token, so
            // there is nothing to send to and no amount of debugging the
            // payload will change that.
            warnWithoutDevice
            label="Who to send to"
            placeholder="Search by name, phone or email"
          />
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Device token
            </span>
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="fVx9…"
              className={inputClass}
            />
          </label>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Title <span className="normal-case text-text-muted">(optional)</span>
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="BagyesRUSH test"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Body <span className="normal-case text-text-muted">(optional)</span>
            </span>
            <input
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={500}
              placeholder="If you can read this, push delivery is working."
              className={inputClass}
            />
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Payload
          </span>
          <div className="flex flex-col gap-2">
            {MODES.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border-subtle p-3 transition duration-150 hover:bg-surface-muted"
              >
                <input
                  type="radio"
                  name="mode"
                  checked={mode === option.value}
                  onChange={() => setMode(option.value)}
                  className="mt-0.5"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                  <span className="break-words text-xs text-text-muted">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={send}
            disabled={busy || !ready}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send test push"}
          </button>
        </div>
      </div>

      {result && (
        <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Firebase&rsquo;s answer</h3>
            <span className="text-xs text-text-muted">
              {result.tokens_tried} token{result.tokens_tried === 1 ? "" : "s"} tried · project{" "}
              {result.project_id ?? "not set"}
            </span>
          </div>

          {result.results.map((entry, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">{entry.mode}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    entry.http_status >= 200 && entry.http_status < 300
                      ? "bg-status-success/10 text-status-success"
                      : "bg-status-critical/10 text-status-critical"
                  }`}
                >
                  HTTP {entry.http_status}
                </span>
              </div>

              {/* Verbatim, not summarised: the reason to come here is to read
                  what FCM actually said, including fields nobody anticipated. */}
              <pre className="max-h-64 overflow-auto rounded-lg bg-surface-muted p-3 text-xs text-text-secondary">
                {JSON.stringify({ payload: entry.payload, response: entry.response }, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
