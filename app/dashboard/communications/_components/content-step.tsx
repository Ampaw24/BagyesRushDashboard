"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { announcementPriorityMeta } from "../../_lib/communications";
import { ImageIcon, XCircleIcon } from "../../_lib/icons";
import type { AnnouncementDisplay, AnnouncementPriority } from "../../_services/communications-mock-data";
import type { UseCommunicationComposer } from "../../_hooks/use-communication-composer";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SMS_LIMIT = 160;

const DISPLAY_OPTIONS: { value: AnnouncementDisplay; label: string }[] = [
  { value: "banner", label: "Banner" },
  { value: "modal", label: "Modal" },
  { value: "notification_center", label: "Notification Center" },
  { value: "banner_notification", label: "Banner + Notification" },
];

const priorityOptions = Object.entries(announcementPriorityMeta) as [AnnouncementPriority, { label: string }][];

function inputClass() {
  return "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";
}

function labelClass() {
  return "text-sm font-medium text-text-secondary";
}

export function ContentStep({ composer }: { composer: UseCommunicationComposer }) {
  const { state, update, updatePush, updateEmail, updateSms, updateAnnouncement } = composer;
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Only JPG, PNG, and WebP images are supported.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be smaller than 5MB.");
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onload = () => update("imageDataUrl", reader.result as string);
    reader.readAsDataURL(file);
  }

  const smsLength = state.sms.body.length;
  const smsSegments = smsLength === 0 ? 0 : Math.ceil(smsLength / SMS_LIMIT);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="content-title" className={labelClass()}>
          Title
        </label>
        <input id="content-title" value={state.title} onChange={(e) => update("title", e.target.value)} className={inputClass()} placeholder="Scheduled Maintenance Notice" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="content-short" className={labelClass()}>
          Short message
        </label>
        <input
          id="content-short"
          value={state.shortMessage}
          onChange={(e) => update("shortMessage", e.target.value)}
          className={inputClass()}
          placeholder="Our services will undergo scheduled maintenance tonight."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="content-full" className={labelClass()}>
          Full description <span className="text-text-muted">(optional, used for email and announcements)</span>
        </label>
        <textarea
          id="content-full"
          value={state.fullDescription}
          onChange={(e) => update("fullDescription", e.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className={labelClass()}>Image</p>
        {state.imageDataUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- previews an uploaded data URL, which next/image can't optimize */}
            <img src={state.imageDataUrl} alt="" className="h-20 w-20 rounded-lg border border-border-subtle object-cover" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 items-center rounded-lg border border-border-subtle px-3 text-xs font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => update("imageDataUrl", null)}
                className="flex h-9 items-center gap-1 rounded-lg border border-border-subtle px-3 text-xs font-medium text-status-critical transition duration-150 hover:bg-surface-muted"
              >
                <XCircleIcon className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-24 w-full max-w-xs flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-subtle text-text-muted transition duration-150 hover:bg-surface-muted"
          >
            <ImageIcon className="h-5 w-5" />
            <span className="text-xs font-medium">Upload JPG, PNG, or WebP</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
        {imageError && <p className="text-xs text-status-critical">{imageError}</p>}
      </div>

      {state.type === "announcement" && (
        <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-muted p-4">
          <p className="text-sm font-semibold text-foreground">Announcement behavior</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="announcement-priority" className={labelClass()}>
                Priority
              </label>
              <select
                id="announcement-priority"
                value={state.announcement.priority}
                onChange={(e) => updateAnnouncement({ priority: e.target.value as AnnouncementPriority })}
                className={inputClass()}
              >
                {priorityOptions.map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="announcement-display" className={labelClass()}>
                Display mode
              </label>
              <select
                id="announcement-display"
                value={state.announcement.display}
                onChange={(e) => updateAnnouncement({ display: e.target.value as AnnouncementDisplay })}
                className={inputClass()}
              >
                {DISPLAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex min-h-11 w-fit cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={state.announcement.dismissible}
              onChange={(e) => updateAnnouncement({ dismissible: e.target.checked })}
              className="h-4 w-4 accent-brand"
            />
            <span className="text-sm text-foreground">Dismissible</span>
          </label>
        </div>
      )}

      {state.channels.includes("push") && (
        <div className="flex flex-col gap-4 rounded-xl border border-border-subtle p-4">
          <p className="text-sm font-semibold text-foreground">Push notification</p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="push-title" className={labelClass()}>
              Notification title
            </label>
            <input id="push-title" value={state.push.title} onChange={(e) => updatePush({ title: e.target.value })} className={inputClass()} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="push-body" className={labelClass()}>
              Notification body
            </label>
            <input id="push-body" value={state.push.body} onChange={(e) => updatePush({ body: e.target.value })} className={inputClass()} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="push-deeplink" className={labelClass()}>
                Deep link <span className="text-text-muted">(optional)</span>
              </label>
              <input
                id="push-deeplink"
                value={state.push.deepLink}
                onChange={(e) => updatePush({ deepLink: e.target.value })}
                placeholder="/orders"
                className={inputClass()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="push-action" className={labelClass()}>
                Action <span className="text-text-muted">(optional)</span>
              </label>
              <input id="push-action" value={state.push.action} onChange={(e) => updatePush({ action: e.target.value })} placeholder="OPEN_RIDE" className={inputClass()} />
            </div>
          </div>
        </div>
      )}

      {state.channels.includes("email") && (
        <div className="flex flex-col gap-4 rounded-xl border border-border-subtle p-4">
          <p className="text-sm font-semibold text-foreground">Email</p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email-subject" className={labelClass()}>
              Subject
            </label>
            <input id="email-subject" value={state.email.subject} onChange={(e) => updateEmail({ subject: e.target.value })} className={inputClass()} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email-preview" className={labelClass()}>
              Preview text <span className="text-text-muted">(optional)</span>
            </label>
            <input id="email-preview" value={state.email.previewText} onChange={(e) => updateEmail({ previewText: e.target.value })} className={inputClass()} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email-body" className={labelClass()}>
              Email body
            </label>
            <textarea
              id="email-body"
              value={state.email.body}
              onChange={(e) => updateEmail({ body: e.target.value })}
              rows={4}
              className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email-cta" className={labelClass()}>
              Call-to-action label <span className="text-text-muted">(optional)</span>
            </label>
            <input id="email-cta" value={state.email.ctaLabel} onChange={(e) => updateEmail({ ctaLabel: e.target.value })} placeholder="View details" className={inputClass()} />
          </div>
        </div>
      )}

      {state.channels.includes("sms") && (
        <div className="flex flex-col gap-3 rounded-xl border border-border-subtle p-4">
          <p className="text-sm font-semibold text-foreground">SMS</p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sms-body" className={labelClass()}>
              Message
            </label>
            <textarea
              id="sms-body"
              value={state.sms.body}
              onChange={(e) => updateSms({ body: e.target.value })}
              rows={3}
              className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {smsLength} characters · {smsSegments || 1} segment{smsSegments === 1 || smsSegments === 0 ? "" : "s"}
            </span>
            {smsLength > SMS_LIMIT && <span className="font-medium text-status-warning">Exceeds recommended SMS length</span>}
          </div>
        </div>
      )}
    </div>
  );
}
