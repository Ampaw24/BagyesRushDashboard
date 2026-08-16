"use client";

import { channelMeta } from "../../_lib/communications";
import type { CommunicationChannel } from "../../_services/communications-mock-data";
import type { UseCommunicationComposer } from "../../_hooks/use-communication-composer";

const CHANNEL_ORDER: CommunicationChannel[] = ["push", "email", "sms", "in_app"];

const CHANNEL_DESCRIPTIONS: Record<CommunicationChannel, string> = {
  push: "Delivered to registered mobile devices.",
  email: "Sent to the recipient's email address.",
  sms: "Delivered as a text message.",
  in_app: "Shown in the in-app notification center.",
};

export function ChannelsStep({ composer }: { composer: UseCommunicationComposer }) {
  const { state, toggleChannel } = composer;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-text-secondary">Select one or more channels</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CHANNEL_ORDER.map((channel) => {
          const meta = channelMeta[channel];
          const Icon = meta.icon;
          const isActive = state.channels.includes(channel);
          return (
            <button
              key={channel}
              type="button"
              onClick={() => toggleChannel(channel)}
              aria-pressed={isActive}
              className={`flex min-h-11 items-start gap-3 rounded-xl border p-4 text-left transition duration-150 ${
                isActive ? "border-brand bg-brand/5" : "border-border-subtle bg-surface hover:bg-surface-muted"
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-brand text-brand-foreground" : "bg-surface-muted text-text-secondary"}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className={`text-sm font-semibold ${isActive ? "text-brand" : "text-foreground"}`}>{meta.label}</span>
                <span className="break-words text-xs text-text-muted">{CHANNEL_DESCRIPTIONS[channel]}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
