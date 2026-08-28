import type {
  AudiencePreviewDto,
  CommunicationDto,
  CommunicationRecipientDto,
  CommunicationTemplateDto,
} from "../types/api";
import type {
  CommunicationAudience,
  CommunicationChannel,
  CommunicationStatus,
} from "../types/enums";
import { toDate, toDateOrEpoch } from "./dates";

export type CommunicationRow = {
  id: number;
  uuid: string;
  channel: CommunicationChannel;
  channelLabel: string;
  audience: CommunicationAudience;
  audienceLabel: string;
  title: string;
  body: string;
  smsBody: string | null;
  imageUrl: string | null;
  status: CommunicationStatus;
  statusLabel: string;
  isCancellable: boolean;
  isEditable: boolean;
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  recipients: number;
  sent: number;
  failed: number;
  /** Null until a send has actually resolved a recipient count. */
  deliveryRate: number | null;
  authorEmail: string | null;
  createdAt: Date;
  /** The custom-audience ids, so a "selected people" row can say how many. */
  selectedUserCount: number;
};

export function toCommunicationRow(dto: CommunicationDto): CommunicationRow {
  return {
    id: dto.id,
    uuid: dto.uuid,
    channel: dto.channel,
    channelLabel: dto.channel_label,
    audience: dto.audience,
    audienceLabel: dto.audience_label,
    title: dto.title,
    body: dto.body,
    smsBody: dto.sms_body,
    imageUrl: dto.image_url,
    status: dto.status,
    statusLabel: dto.status_label,
    isCancellable: dto.is_cancellable,
    isEditable: dto.is_editable,
    scheduledAt: toDate(dto.scheduled_at),
    startedAt: toDate(dto.started_at),
    completedAt: toDate(dto.completed_at),
    recipients: dto.recipients_count,
    sent: dto.sent_count,
    failed: dto.failed_count,
    deliveryRate: dto.delivery_rate,
    authorEmail: dto.author?.email ?? null,
    createdAt: toDateOrEpoch(dto.created_at),
    selectedUserCount: dto.audience_filters?.user_ids?.length ?? 0,
  };
}

export type CommunicationRecipientRow = {
  id: number;
  channel: "push" | "sms";
  status: "pending" | "sent" | "failed" | "skipped";
  error: string | null;
  sentAt: Date | null;
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

export function toCommunicationRecipientRow(
  dto: CommunicationRecipientDto,
): CommunicationRecipientRow {
  return {
    id: dto.id,
    channel: dto.channel,
    status: dto.status,
    error: dto.error,
    sentAt: toDate(dto.sent_at),
    name: dto.user?.name ?? "—",
    email: dto.user?.email ?? "—",
    phone: dto.user?.phone ?? null,
    role: dto.user?.role ?? "—",
  };
}

export type CommunicationTemplateRow = {
  id: number;
  name: string;
  channel: CommunicationChannel;
  channelLabel: string;
  title: string;
  body: string;
  smsBody: string | null;
  placeholders: string[];
  isActive: boolean;
  updatedAt: Date;
};

export function toCommunicationTemplateRow(
  dto: CommunicationTemplateDto,
): CommunicationTemplateRow {
  return {
    id: dto.id,
    name: dto.name,
    channel: dto.channel,
    channelLabel: dto.channel_label,
    title: dto.title,
    body: dto.body,
    smsBody: dto.sms_body,
    placeholders: dto.placeholders ?? [],
    isActive: dto.is_active,
    updatedAt: toDateOrEpoch(dto.updated_at),
  };
}

export type AudiencePreview = {
  recipients: number;
  reachableByPush: number;
  reachableBySms: number;
  audienceLabel: string;
};

export function toAudiencePreview(dto: AudiencePreviewDto): AudiencePreview {
  return {
    recipients: dto.recipients,
    reachableByPush: dto.reachable_by_push,
    reachableBySms: dto.reachable_by_sms,
    audienceLabel: dto.audience_label,
  };
}
