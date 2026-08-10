import type { BadgeMeta } from "./status";
import {
  BellIcon,
  ChatIcon,
  MailIcon,
  MobileIcon,
  type IconComponent,
} from "./icons";
import type {
  AnnouncementPriority,
  AudienceRole,
  CommunicationChannel,
  CommunicationStatus,
  CommunicationType,
} from "../_services/communications-mock-data";

export const communicationStatusMeta: Record<CommunicationStatus, BadgeMeta> = {
  draft: {
    label: "Draft",
    dotClassName: "bg-zinc-400",
    badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
  },
  scheduled: {
    label: "Scheduled",
    dotClassName: "bg-status-info",
    badgeClassName: "bg-status-info/10 text-status-info",
  },
  processing: {
    label: "Processing",
    dotClassName: "bg-status-warning",
    badgeClassName: "bg-status-warning/10 text-amber-700 dark:text-amber-400",
  },
  sent: {
    label: "Sent",
    dotClassName: "bg-status-good",
    badgeClassName: "bg-status-good/10 text-status-good",
  },
  partially_sent: {
    label: "Partially sent",
    dotClassName: "bg-status-warning",
    badgeClassName: "bg-status-warning/10 text-amber-700 dark:text-amber-400",
  },
  failed: {
    label: "Failed",
    dotClassName: "bg-status-critical",
    badgeClassName: "bg-status-critical/10 text-status-critical",
  },
  cancelled: {
    label: "Cancelled",
    dotClassName: "bg-zinc-400",
    badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
  },
};

export const communicationTypeMeta: Record<CommunicationType, { label: string }> = {
  notification: { label: "Notification" },
  announcement: { label: "Announcement" },
  promotional: { label: "Promotional" },
  system_update: { label: "System Update" },
  maintenance: { label: "Maintenance Notice" },
  general: { label: "General Information" },
};

export const channelMeta: Record<CommunicationChannel, { label: string; icon: IconComponent; colorClassName: string }> = {
  push: { label: "Push", icon: BellIcon, colorClassName: "bg-brand" },
  email: { label: "Email", icon: MailIcon, colorClassName: "bg-status-info" },
  sms: { label: "SMS", icon: ChatIcon, colorClassName: "bg-status-warning" },
  in_app: { label: "In-App", icon: MobileIcon, colorClassName: "bg-status-good" },
};

export const announcementPriorityMeta: Record<AnnouncementPriority, BadgeMeta> = {
  normal: {
    label: "Normal",
    dotClassName: "bg-zinc-400",
    badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
  },
  important: {
    label: "Important",
    dotClassName: "bg-status-warning",
    badgeClassName: "bg-status-warning/10 text-amber-700 dark:text-amber-400",
  },
  critical: {
    label: "Critical",
    dotClassName: "bg-status-critical",
    badgeClassName: "bg-status-critical/10 text-status-critical",
  },
};

export const audienceRoleMeta: Record<AudienceRole, { label: string }> = {
  rider: { label: "Riders" },
  customer: { label: "Customers" },
};
