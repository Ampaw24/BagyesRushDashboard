import { useMemo, useState } from "react";
import type {
  AnnouncementDisplay,
  AnnouncementPriority,
  AudienceDirectoryEntry,
  AudienceRole,
  AudienceSegment,
  AudienceType,
  CommunicationChannel,
  CommunicationTemplate,
  CommunicationType,
} from "../_services/communications-mock-data";

export const COMPOSER_STEPS = ["Audience", "Channels", "Content", "Schedule", "Review"] as const;

export type ComposerAudience = {
  type: AudienceType;
  roles: AudienceRole[];
  segmentId: string | null;
  userIds: string[];
};

export type ComposerState = {
  step: number;
  type: CommunicationType;
  audience: ComposerAudience;
  channels: CommunicationChannel[];
  title: string;
  shortMessage: string;
  fullDescription: string;
  imageDataUrl: string | null;
  push: { title: string; body: string; deepLink: string; action: string };
  email: { subject: string; previewText: string; body: string; ctaLabel: string };
  sms: { body: string };
  announcement: { priority: AnnouncementPriority; display: AnnouncementDisplay; dismissible: boolean; startAt: string; expiresAt: string };
  sendMode: "now" | "schedule";
  scheduledDate: string;
  scheduledTime: string;
  largeAudienceConfirmed: boolean;
};

export type SubmitAction = "send" | "schedule" | "draft";
export type SubmitStatus = { phase: "idle" | "submitting" | "done"; action?: SubmitAction };

const LARGE_AUDIENCE_THRESHOLD = 1000;

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function initialState(initialType: CommunicationType, template?: CommunicationTemplate): ComposerState {
  return {
    step: 0,
    type: initialType,
    audience: { type: "all", roles: template?.audienceRoles ?? [], segmentId: null, userIds: [] },
    channels: template?.channels ?? [],
    title: template?.title ?? "",
    shortMessage: template?.message ?? "",
    fullDescription: "",
    imageDataUrl: template?.imageUrl ?? null,
    push: { title: template?.title ?? "", body: template?.message ?? "", deepLink: "", action: "OPEN_APP" },
    email: { subject: template?.title ?? "", previewText: template?.message ?? "", body: template?.message ?? "", ctaLabel: template?.ctaLabel ?? "" },
    sms: { body: template?.message ?? "" },
    announcement: { priority: "normal", display: "banner", dismissible: true, startAt: todayISODate(), expiresAt: "" },
    sendMode: "now",
    scheduledDate: "",
    scheduledTime: "",
    largeAudienceConfirmed: false,
  };
}

export function useCommunicationComposer(
  directory: AudienceDirectoryEntry[],
  segments: AudienceSegment[],
  initialType: CommunicationType = "notification",
  template?: CommunicationTemplate
) {
  const [state, setState] = useState<ComposerState>(() => initialState(initialType, template));
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>({ phase: "idle" });

  function update<K extends keyof ComposerState>(key: K, value: ComposerState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function updateAudience(patch: Partial<ComposerAudience>) {
    setState((prev) => ({ ...prev, audience: { ...prev.audience, ...patch } }));
  }

  function updatePush(patch: Partial<ComposerState["push"]>) {
    setState((prev) => ({ ...prev, push: { ...prev.push, ...patch } }));
  }

  function updateEmail(patch: Partial<ComposerState["email"]>) {
    setState((prev) => ({ ...prev, email: { ...prev.email, ...patch } }));
  }

  function updateSms(patch: Partial<ComposerState["sms"]>) {
    setState((prev) => ({ ...prev, sms: { ...prev.sms, ...patch } }));
  }

  function updateAnnouncement(patch: Partial<ComposerState["announcement"]>) {
    setState((prev) => ({ ...prev, announcement: { ...prev.announcement, ...patch } }));
  }

  function toggleChannel(channel: CommunicationChannel) {
    setState((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel) ? prev.channels.filter((c) => c !== channel) : [...prev.channels, channel],
    }));
  }

  const resolvedCount = useMemo(() => {
    switch (state.audience.type) {
      case "all":
        return directory.length;
      case "role":
        return directory.filter((d) => state.audience.roles.includes(d.role)).length;
      case "segment":
        return segments.find((s) => s.id === state.audience.segmentId)?.count ?? 0;
      case "users":
        return state.audience.userIds.length;
      default:
        return 0;
    }
  }, [state.audience, directory, segments]);

  const stepErrors = useMemo(() => getStepErrors(state, resolvedCount), [state, resolvedCount]);

  function goToStep(step: number) {
    setState((prev) => ({ ...prev, step }));
  }

  function next() {
    if (stepErrors.length > 0) return;
    setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, COMPOSER_STEPS.length - 1) }));
  }

  function back() {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 0) }));
  }

  async function submit(action: SubmitAction) {
    setSubmitStatus({ phase: "submitting", action });
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSubmitStatus({ phase: "done", action });
  }

  return {
    state,
    update,
    updateAudience,
    updatePush,
    updateEmail,
    updateSms,
    updateAnnouncement,
    toggleChannel,
    resolvedCount,
    stepErrors,
    goToStep,
    next,
    back,
    submit,
    submitStatus,
    largeAudienceThreshold: LARGE_AUDIENCE_THRESHOLD,
  };
}

export type UseCommunicationComposer = ReturnType<typeof useCommunicationComposer>;

function getStepErrors(state: ComposerState, resolvedCount: number): string[] {
  const errors: string[] = [];

  if (state.step === 0) {
    if (state.audience.type === "role" && state.audience.roles.length === 0) errors.push("Select at least one role.");
    if (state.audience.type === "segment" && !state.audience.segmentId) errors.push("Select a segment.");
    if (state.audience.type === "users" && state.audience.userIds.length === 0) errors.push("Select at least one recipient.");
    if (resolvedCount === 0) errors.push("This audience has no recipients yet.");
  }

  if (state.step === 1) {
    if (state.channels.length === 0) errors.push("Select at least one channel.");
  }

  if (state.step === 2) {
    if (state.title.trim() === "") errors.push("Title is required.");
    if (state.shortMessage.trim() === "") errors.push("Short message is required.");
    if (state.channels.includes("push") && (state.push.title.trim() === "" || state.push.body.trim() === ""))
      errors.push("Push title and body are required.");
    if (state.channels.includes("email") && state.email.subject.trim() === "") errors.push("Email subject is required.");
    if (state.channels.includes("sms") && state.sms.body.trim() === "") errors.push("SMS message is required.");
  }

  if (state.step === 3) {
    if (state.sendMode === "schedule") {
      if (!state.scheduledDate || !state.scheduledTime) {
        errors.push("Choose a schedule date and time.");
      } else {
        const scheduledAt = new Date(`${state.scheduledDate}T${state.scheduledTime}`);
        if (scheduledAt.getTime() < Date.now()) errors.push("Scheduled date cannot be in the past.");
      }
    }
  }

  if (state.step === 4) {
    if (resolvedCount > 1000 && !state.largeAudienceConfirmed) errors.push("Confirm sending to a large audience.");
  }

  return errors;
}
