"use client";

import { useState } from "react";
import Link from "next/link";
import { channelMeta, communicationTypeMeta, audienceRoleMeta } from "../../_lib/communications";
import { CheckCircleIcon, MailIcon } from "../../_lib/icons";
import { AnnouncementBannerPreview } from "./announcement-banner-preview";
import type { AudienceSegment, CommunicationChannel } from "../../_services/communications-mock-data";
import type { UseCommunicationComposer } from "../../_hooks/use-communication-composer";

function audienceLabel(composer: UseCommunicationComposer, segments: AudienceSegment[]): string {
  const { audience } = composer.state;
  if (audience.type === "all") return "All users";
  if (audience.type === "role") return audience.roles.map((r) => audienceRoleMeta[r].label).join(" + ") || "No roles selected";
  if (audience.type === "segment") return segments.find((s) => s.id === audience.segmentId)?.label ?? "No segment selected";
  return `${audience.userIds.length} selected user${audience.userIds.length === 1 ? "" : "s"}`;
}

function scheduleLabel(composer: UseCommunicationComposer): string {
  const { state } = composer;
  if (state.sendMode === "now") return "Immediately";
  if (!state.scheduledDate || !state.scheduledTime) return "Not set";
  return new Date(`${state.scheduledDate}T${state.scheduledTime}`).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReviewStep({ composer, segments }: { composer: UseCommunicationComposer; segments: AudienceSegment[] }) {
  const { state, update, resolvedCount, stepErrors, submit, submitStatus, largeAudienceThreshold } = composer;
  const [activeTab, setActiveTab] = useState<CommunicationChannel>(state.channels[0] ?? "push");
  const isLargeAudience = resolvedCount > largeAudienceThreshold;

  if (submitStatus.phase === "done") {
    const actionLabel = submitStatus.action === "draft" ? "saved as a draft" : submitStatus.action === "schedule" ? "scheduled" : "sent";
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
        <CheckCircleIcon className="h-10 w-10 text-status-good" />
        <p className="text-base font-semibold text-foreground">Communication {actionLabel}</p>
        <p className="max-w-sm text-sm text-text-muted">
          {submitStatus.action === "send" ? `Sending to ${resolvedCount.toLocaleString()} recipients.` : "You can find it from the Communications section."}
        </p>
        <div className="mt-2 flex gap-3">
          <Link
            href="/dashboard/communications/history"
            className="flex h-10 items-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
          >
            View history
          </Link>
          <Link
            href="/dashboard/communications"
            className="flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            Back to overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text-secondary">Preview</p>
        <div className="flex flex-wrap gap-2">
          {state.channels.map((channel) => {
            const meta = channelMeta[channel];
            return (
              <button
                key={channel}
                type="button"
                onClick={() => setActiveTab(channel)}
                aria-pressed={activeTab === channel}
                className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition duration-150 ${
                  activeTab === channel ? "bg-brand text-brand-foreground" : "bg-surface-muted text-text-secondary hover:bg-border-subtle"
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-muted p-6">
          {activeTab === "push" && (
            <div className="mx-auto flex w-full max-w-xs flex-col gap-1 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">{state.push.title || state.title || "Push title"}</p>
              <p className="break-words text-xs text-text-secondary">{state.push.body || state.shortMessage || "Push body"}</p>
            </div>
          )}
          {activeTab === "in_app" &&
            (state.type === "announcement" ? (
              <AnnouncementBannerPreview
                title={state.title}
                description={state.shortMessage}
                imageUrl={state.imageDataUrl}
                ctaLabel={state.email.ctaLabel}
                dismissible={state.announcement.dismissible}
              />
            ) : (
              <div className="mx-auto flex w-full max-w-xs flex-col gap-1 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
                <p className="text-sm font-semibold text-foreground">{state.title || "In-app title"}</p>
                <p className="break-words text-xs text-text-secondary">{state.shortMessage || "In-app message"}</p>
              </div>
            ))}
          {activeTab === "email" && (
            <div className="mx-auto flex w-full max-w-md flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <MailIcon className="h-4.5 w-4.5" />
              </span>
              <p className="text-sm font-semibold text-foreground">{state.email.subject || "Email subject"}</p>
              <p className="break-words text-xs text-text-muted">{state.email.previewText}</p>
              <p className="break-words text-sm text-text-secondary">{state.email.body || state.fullDescription || state.shortMessage}</p>
              {state.email.ctaLabel && (
                <span className="mt-1 inline-flex h-9 w-fit items-center rounded-lg bg-brand px-4 text-xs font-semibold text-brand-foreground">
                  {state.email.ctaLabel}
                </span>
              )}
            </div>
          )}
          {activeTab === "sms" && (
            <div className="mx-auto flex w-full max-w-xs flex-col gap-1.5">
              <div className="rounded-2xl rounded-bl-sm bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm">{state.sms.body || "SMS message"}</div>
              <p className="px-1 text-xs text-text-muted">{state.sms.body.length} characters</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Review communication</p>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-muted">Type</dt>
            <dd className="font-medium text-foreground">{communicationTypeMeta[state.type].label}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Channels</dt>
            <dd className="font-medium text-foreground">{state.channels.map((c) => channelMeta[c].label).join(" + ") || "None selected"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Audience</dt>
            <dd className="font-medium text-foreground">{audienceLabel(composer, segments)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Recipients</dt>
            <dd className="font-medium text-foreground">{resolvedCount.toLocaleString()} users</dd>
          </div>
          <div>
            <dt className="text-text-muted">Scheduled</dt>
            <dd className="font-medium text-foreground">{scheduleLabel(composer)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Title</dt>
            <dd className="font-medium text-foreground">{state.title || "Untitled"}</dd>
          </div>
        </dl>

        {isLargeAudience && (
          <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg bg-status-warning/10 p-3">
            <input
              type="checkbox"
              checked={state.largeAudienceConfirmed}
              onChange={(e) => update("largeAudienceConfirmed", e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand"
            />
            <span className="text-sm text-foreground">
              I confirm I want to send this to {resolvedCount.toLocaleString()} recipients.
            </span>
          </label>
        )}
      </div>

      {stepErrors.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-lg bg-status-critical/10 p-3 text-xs text-status-critical">
          {stepErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/communications"
          className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={() => submit("draft")}
          disabled={submitStatus.phase === "submitting"}
          className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
        >
          Save as draft
        </button>
        <button
          type="button"
          onClick={() => submit(state.sendMode === "schedule" ? "schedule" : "send")}
          disabled={stepErrors.length > 0 || submitStatus.phase === "submitting"}
          className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitStatus.phase === "submitting"
            ? "Sending…"
            : state.sendMode === "schedule"
              ? "Schedule communication"
              : "Send communication"}
        </button>
      </div>
    </div>
  );
}
