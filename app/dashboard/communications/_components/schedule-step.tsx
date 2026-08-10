"use client";

import { useMemo } from "react";
import type { UseCommunicationComposer } from "../../_hooks/use-communication-composer";

function inputClass() {
  return "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";
}

export function ScheduleStep({ composer }: { composer: UseCommunicationComposer }) {
  const { state, update, updateAnnouncement } = composer;
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text-secondary">When should this send?</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => update("sendMode", "now")}
            aria-pressed={state.sendMode === "now"}
            className={`flex min-h-11 flex-col gap-1 rounded-xl border p-4 text-left transition duration-150 ${
              state.sendMode === "now" ? "border-brand bg-brand/5" : "border-border-subtle bg-surface hover:bg-surface-muted"
            }`}
          >
            <span className={`text-sm font-semibold ${state.sendMode === "now" ? "text-brand" : "text-foreground"}`}>Send now</span>
            <span className="text-xs text-text-muted">Process immediately after confirmation.</span>
          </button>
          <button
            type="button"
            onClick={() => update("sendMode", "schedule")}
            aria-pressed={state.sendMode === "schedule"}
            className={`flex min-h-11 flex-col gap-1 rounded-xl border p-4 text-left transition duration-150 ${
              state.sendMode === "schedule" ? "border-brand bg-brand/5" : "border-border-subtle bg-surface hover:bg-surface-muted"
            }`}
          >
            <span className={`text-sm font-semibold ${state.sendMode === "schedule" ? "text-brand" : "text-foreground"}`}>Schedule</span>
            <span className="text-xs text-text-muted">Queue for a specific date and time.</span>
          </button>
        </div>
      </div>

      {state.sendMode === "schedule" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="schedule-date" className="text-sm font-medium text-text-secondary">
              Date
            </label>
            <input
              id="schedule-date"
              type="date"
              value={state.scheduledDate}
              onChange={(e) => update("scheduledDate", e.target.value)}
              className={inputClass()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="schedule-time" className="text-sm font-medium text-text-secondary">
              Time
            </label>
            <input
              id="schedule-time"
              type="time"
              value={state.scheduledTime}
              onChange={(e) => update("scheduledTime", e.target.value)}
              className={inputClass()}
            />
          </div>
          <p className="text-xs text-text-muted sm:col-span-2">Times are shown in your local time zone ({timezone}).</p>
        </div>
      )}

      {state.type === "announcement" && (
        <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-muted p-4">
          <p className="text-sm font-semibold text-foreground">Announcement visibility</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="announcement-start" className="text-sm font-medium text-text-secondary">
                Start date
              </label>
              <input
                id="announcement-start"
                type="date"
                value={state.announcement.startAt}
                onChange={(e) => updateAnnouncement({ startAt: e.target.value })}
                className={inputClass()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="announcement-expiry" className="text-sm font-medium text-text-secondary">
                Expires <span className="text-text-muted">(optional)</span>
              </label>
              <input
                id="announcement-expiry"
                type="date"
                value={state.announcement.expiresAt}
                onChange={(e) => updateAnnouncement({ expiresAt: e.target.value })}
                className={inputClass()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
