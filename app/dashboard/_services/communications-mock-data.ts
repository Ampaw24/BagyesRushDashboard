import { mulberry32, RIDER_COUNT, CUSTOMER_COUNT, getRiders, getCustomers } from "./mock-data";
import type { DayPoint } from "./mock-data";

export type CommunicationType = "notification" | "announcement" | "promotional" | "system_update" | "maintenance" | "general";
export type CommunicationChannel = "push" | "email" | "sms" | "in_app";
export type CommunicationStatus = "draft" | "scheduled" | "processing" | "sent" | "partially_sent" | "failed" | "cancelled";
export type AudienceRole = "rider" | "customer";
export type AudienceType = "all" | "role" | "users" | "segment";
export type AnnouncementPriority = "normal" | "important" | "critical";
export type AnnouncementDisplay = "banner" | "modal" | "notification_center" | "banner_notification";

export type Audience = {
  type: AudienceType;
  roles?: AudienceRole[];
  segment?: string;
  userIds?: string[];
  resolvedCount: number;
};

export type ChannelStats = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  bounced?: number;
  dismissed?: number;
};

export type PushContent = { title: string; body: string; deepLink?: string; action?: string };
export type EmailContent = { subject: string; previewText?: string; body: string; ctaLabel?: string };
export type SmsContent = { body: string };
export type AnnouncementSettings = {
  priority: AnnouncementPriority;
  display: AnnouncementDisplay;
  dismissible: boolean;
  startAt: Date;
  expiresAt: Date | null;
};

export type Communication = {
  id: string;
  title: string;
  shortMessage: string;
  fullDescription?: string;
  imageUrl?: string;
  type: CommunicationType;
  status: CommunicationStatus;
  channels: CommunicationChannel[];
  audience: Audience;
  push?: PushContent;
  email?: EmailContent;
  sms?: SmsContent;
  announcement?: AnnouncementSettings;
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  stats: Partial<Record<CommunicationChannel, ChannelStats>>;
};

export type CommunicationTemplate = {
  id: string;
  name: string;
  type: CommunicationType;
  channels: CommunicationChannel[];
  title: string;
  message: string;
  imageUrl?: string;
  ctaLabel?: string;
  audienceRoles: AudienceRole[];
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
};

export type AudienceDirectoryEntry = { id: string; name: string; phone: string; email?: string; role: AudienceRole };
export type AudienceSegment = { id: string; label: string; role: AudienceRole; count: number };
export type ChannelUsage = { channel: CommunicationChannel; count: number };

const NOW = new Date("2026-08-07T17:30:00");
const ADMIN_NAMES = ["Chioma Nwadike", "Bashir Umar", "Funmilayo Ade", "Tochukwu Igwe", "Patience Okoli"];

const rand = mulberry32(7);

function daysAgo(n: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + n);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function buildChannelStats(recipients: number, quality: number): ChannelStats {
  const delivered = Math.round(recipients * Math.min(1, quality + rand() * 0.05));
  const opened = Math.round(delivered * (0.35 + rand() * 0.3));
  const clicked = Math.round(opened * (0.2 + rand() * 0.3));
  return { sent: recipients, delivered, opened, clicked, failed: recipients - delivered };
}

function buildEmailStats(recipients: number, quality: number): ChannelStats {
  const base = buildChannelStats(recipients, quality);
  return { ...base, bounced: base.failed };
}

function buildSmsStats(recipients: number, quality: number): ChannelStats {
  const delivered = Math.round(recipients * Math.min(1, quality + rand() * 0.04));
  return { sent: recipients, delivered, opened: 0, clicked: 0, failed: recipients - delivered };
}

function buildInAppStats(recipients: number, quality: number): ChannelStats {
  const delivered = Math.round(recipients * quality);
  const opened = Math.round(delivered * (0.5 + rand() * 0.3));
  const clicked = Math.round(opened * (0.25 + rand() * 0.3));
  const dismissed = Math.round(delivered * (0.15 + rand() * 0.2));
  return { sent: recipients, delivered, opened, clicked, failed: recipients - delivered, dismissed };
}

function buildStats(status: CommunicationStatus, channels: CommunicationChannel[], recipients: number): Partial<Record<CommunicationChannel, ChannelStats>> {
  if (status === "draft" || status === "scheduled" || status === "cancelled") return {};

  const quality = status === "sent" ? 0.93 : status === "partially_sent" ? 0.55 : status === "failed" ? 0.08 : 0.4;
  const stats: Partial<Record<CommunicationChannel, ChannelStats>> = {};
  for (const channel of channels) {
    if (channel === "email") stats.email = buildEmailStats(recipients, quality);
    else if (channel === "sms") stats.sms = buildSmsStats(recipients, quality);
    else if (channel === "in_app") stats.in_app = buildInAppStats(recipients, quality);
    else stats.push = buildChannelStats(recipients, quality);
  }
  return stats;
}

type SeedInput = {
  title: string;
  shortMessage: string;
  fullDescription?: string;
  type: CommunicationType;
  status: CommunicationStatus;
  channels: CommunicationChannel[];
  audience: Omit<Audience, "resolvedCount"> & { resolvedCount?: number };
  daysOffset: number; // negative = past (createdAt basis), positive = future (scheduledAt basis)
  announcement?: AnnouncementSettings;
  hasImage?: boolean;
};

const SEEDS: SeedInput[] = [
  {
    title: "Scheduled Maintenance Notice",
    shortMessage: "Our services will undergo scheduled maintenance tonight.",
    fullDescription: "Payment processing will be briefly unavailable from 11:00 PM to 1:00 AM while we roll out infrastructure upgrades.",
    type: "maintenance",
    status: "sent",
    channels: ["push", "email", "in_app"],
    audience: { type: "all", resolvedCount: RIDER_COUNT + CUSTOMER_COUNT },
    daysOffset: -6,
    hasImage: true,
  },
  {
    title: "Payment System Update",
    shortMessage: "We've upgraded our payment system for faster checkouts.",
    type: "system_update",
    status: "sent",
    channels: ["email"],
    audience: { type: "role", roles: ["customer"], resolvedCount: CUSTOMER_COUNT },
    daysOffset: -12,
  },
  {
    title: "New Feature: Live Order Tracking",
    shortMessage: "Track your delivery in real time, right from the order screen.",
    type: "notification",
    status: "sent",
    channels: ["push", "in_app"],
    audience: { type: "all", resolvedCount: RIDER_COUNT + CUSTOMER_COUNT },
    daysOffset: -3,
  },
  {
    title: "Weekend Delivery Discount",
    shortMessage: "Get 20% off all deliveries this Saturday and Sunday.",
    type: "promotional",
    status: "sent",
    channels: ["push", "sms"],
    audience: { type: "role", roles: ["customer"], resolvedCount: CUSTOMER_COUNT },
    daysOffset: -9,
    hasImage: true,
  },
  {
    title: "Welcome to Bagyes Rush",
    shortMessage: "Thanks for joining — here's how to get the most out of your first order.",
    type: "general",
    status: "sent",
    channels: ["email"],
    audience: { type: "segment", segment: "New customers", resolvedCount: Math.round(CUSTOMER_COUNT * 0.25) },
    daysOffset: -18,
  },
  {
    title: "Rider App Update Required",
    shortMessage: "Please update the rider app to version 4.2 to keep receiving orders.",
    type: "system_update",
    status: "sent",
    channels: ["push"],
    audience: { type: "role", roles: ["rider"], resolvedCount: RIDER_COUNT },
    daysOffset: -5,
  },
  {
    title: "Independence Day Promo",
    shortMessage: "Celebrate with free delivery on orders over ₦5,000.",
    type: "promotional",
    status: "scheduled",
    channels: ["push", "email", "sms"],
    audience: { type: "all", resolvedCount: RIDER_COUNT + CUSTOMER_COUNT },
    daysOffset: 6,
    hasImage: true,
  },
  {
    title: "Server Migration Notice",
    shortMessage: "Brief service disruption expected during our server migration.",
    type: "maintenance",
    status: "scheduled",
    channels: ["email", "in_app"],
    audience: { type: "all", resolvedCount: RIDER_COUNT + CUSTOMER_COUNT },
    daysOffset: 3,
  },
  {
    title: "New Rider Bonus Program",
    shortMessage: "Earn extra for every 10 deliveries completed this month.",
    type: "announcement",
    status: "sent",
    channels: ["in_app", "push"],
    audience: { type: "role", roles: ["rider"], resolvedCount: RIDER_COUNT },
    daysOffset: -8,
    hasImage: true,
    announcement: { priority: "important", display: "banner_notification", dismissible: true, startAt: daysAgo(8), expiresAt: daysFromNow(7) },
  },
  {
    title: "Payment Delay — VI Zone",
    shortMessage: "Some Victoria Island customers may see delayed payment confirmations.",
    type: "notification",
    status: "failed",
    channels: ["sms"],
    audience: { type: "segment", segment: "VI zone customers", resolvedCount: Math.round(CUSTOMER_COUNT * 0.2) },
    daysOffset: -2,
  },
  {
    title: "Holiday Hours Update",
    shortMessage: "Our support hours are changing over the upcoming holiday.",
    type: "general",
    status: "partially_sent",
    channels: ["email"],
    audience: { type: "all", resolvedCount: RIDER_COUNT + CUSTOMER_COUNT },
    daysOffset: -1,
  },
  {
    title: "Coupon Code Expiring Soon",
    shortMessage: "Your RUSH10 code expires in 48 hours — don't miss out.",
    type: "promotional",
    status: "sent",
    channels: ["push"],
    audience: { type: "role", roles: ["customer"], resolvedCount: CUSTOMER_COUNT },
    daysOffset: -4,
  },
  {
    title: "Critical: Payment Gateway Down",
    shortMessage: "We're aware of an issue affecting checkout and are working on a fix.",
    fullDescription: "Card payments may fail intermittently. Wallet and cash-on-delivery are unaffected. We'll post updates here as we resolve this.",
    type: "announcement",
    status: "sent",
    channels: ["push", "in_app", "email"],
    audience: { type: "all", resolvedCount: RIDER_COUNT + CUSTOMER_COUNT },
    daysOffset: -14,
    announcement: { priority: "critical", display: "modal", dismissible: false, startAt: daysAgo(14), expiresAt: daysAgo(13) },
  },
  {
    title: "Rider Safety Guidelines",
    shortMessage: "Updated safety guidelines for wet-season deliveries.",
    type: "general",
    status: "draft",
    channels: ["in_app"],
    audience: { type: "role", roles: ["rider"], resolvedCount: RIDER_COUNT },
    daysOffset: 0,
  },
  {
    title: "Referral Program Launch",
    shortMessage: "Invite a friend, you both get ₦1,000 in credit.",
    type: "promotional",
    status: "draft",
    channels: ["push", "email", "sms"],
    audience: { type: "all", resolvedCount: RIDER_COUNT + CUSTOMER_COUNT },
    daysOffset: 0,
    hasImage: true,
  },
  {
    title: "App Store Update Available",
    shortMessage: "Version 5.0 is live with a faster checkout flow.",
    type: "system_update",
    status: "scheduled",
    channels: ["push"],
    audience: { type: "all", resolvedCount: RIDER_COUNT + CUSTOMER_COUNT },
    daysOffset: 2,
  },
  {
    title: "Customer Appreciation Week",
    shortMessage: "Enjoy exclusive perks all week as a thank-you from us.",
    type: "promotional",
    status: "sent",
    channels: ["email", "in_app"],
    audience: { type: "role", roles: ["customer"], resolvedCount: CUSTOMER_COUNT },
    daysOffset: -20,
    hasImage: true,
  },
  {
    title: "Rider Incentive Update",
    shortMessage: "New peak-hour incentive rates start this weekend.",
    type: "announcement",
    status: "scheduled",
    channels: ["in_app"],
    audience: { type: "role", roles: ["rider"], resolvedCount: RIDER_COUNT },
    daysOffset: 4,
    announcement: { priority: "important", display: "banner", dismissible: true, startAt: daysFromNow(4), expiresAt: daysFromNow(11) },
  },
  {
    title: "Service Interruption — Lagos",
    shortMessage: "Heavy rainfall is causing delivery delays across Lagos.",
    type: "maintenance",
    status: "sent",
    channels: ["push", "sms", "in_app"],
    audience: { type: "segment", segment: "Lagos customers", resolvedCount: Math.round(CUSTOMER_COUNT * 0.6) },
    daysOffset: -7,
  },
  {
    title: "Delivery Zone Expansion",
    shortMessage: "We now deliver to Ajah and Sangotedo.",
    type: "general",
    status: "sent",
    channels: ["email"],
    audience: { type: "all", resolvedCount: RIDER_COUNT + CUSTOMER_COUNT },
    daysOffset: -25,
  },
  {
    title: "Cancelled Promo — Flash Sale",
    shortMessage: "Flash sale on delivery fees this afternoon.",
    type: "promotional",
    status: "cancelled",
    channels: ["push", "email"],
    audience: { type: "role", roles: ["customer"], resolvedCount: CUSTOMER_COUNT },
    daysOffset: -1,
  },
  {
    title: "SMS Delivery Test",
    shortMessage: "This is a test message for our SMS provider integration.",
    type: "notification",
    status: "failed",
    channels: ["sms"],
    audience: { type: "role", roles: ["rider"], resolvedCount: RIDER_COUNT },
    daysOffset: -10,
  },
  {
    title: "Q3 Platform Update",
    shortMessage: "New dashboard analytics and performance improvements are rolling out.",
    type: "system_update",
    status: "processing",
    channels: ["push", "email", "in_app"],
    audience: { type: "all", resolvedCount: RIDER_COUNT + CUSTOMER_COUNT },
    daysOffset: 0,
  },
  {
    title: "Emergency: Weather Advisory",
    shortMessage: "Severe weather expected tonight — deliveries may be delayed for rider safety.",
    type: "announcement",
    status: "sent",
    channels: ["push", "sms", "in_app"],
    audience: { type: "all", resolvedCount: RIDER_COUNT + CUSTOMER_COUNT },
    daysOffset: -16,
    announcement: { priority: "critical", display: "banner_notification", dismissible: false, startAt: daysAgo(16), expiresAt: daysAgo(15) },
  },
];

function buildCommunications(): Communication[] {
  return SEEDS.map((seed, i) => {
    const id = `CM-${(1200 + i).toString()}`;
    const recipients = seed.audience.resolvedCount ?? 0;
    const isFuture = seed.status === "scheduled" || (seed.status === "draft" && seed.daysOffset >= 0);
    const createdAt = isFuture ? daysAgo(1 + Math.floor(rand() * 3)) : daysAgo(-seed.daysOffset + Math.floor(rand() * 2));
    const scheduledAt = seed.status === "scheduled" ? daysFromNow(seed.daysOffset) : null;
    const sentAt = seed.status === "sent" || seed.status === "partially_sent" || seed.status === "failed" ? daysAgo(-seed.daysOffset) : null;

    const push: PushContent | undefined = seed.channels.includes("push")
      ? { title: seed.title, body: seed.shortMessage, deepLink: pick(["/orders", "/payments", "/rides", "/profile"]), action: "OPEN_APP" }
      : undefined;
    const email: EmailContent | undefined = seed.channels.includes("email")
      ? { subject: seed.title, previewText: seed.shortMessage, body: seed.fullDescription ?? seed.shortMessage, ctaLabel: "Learn more" }
      : undefined;
    const sms: SmsContent | undefined = seed.channels.includes("sms") ? { body: `${seed.title}: ${seed.shortMessage}` } : undefined;

    return {
      id,
      title: seed.title,
      shortMessage: seed.shortMessage,
      fullDescription: seed.fullDescription,
      imageUrl: seed.hasImage ? "/delivery-pattern.svg" : undefined,
      type: seed.type,
      status: seed.status,
      channels: seed.channels,
      audience: { ...seed.audience, resolvedCount: recipients },
      push,
      email,
      sms,
      announcement: seed.announcement,
      scheduledAt,
      sentAt,
      createdBy: pick(ADMIN_NAMES),
      createdAt,
      updatedAt: sentAt ?? createdAt,
      stats: buildStats(seed.status, seed.channels, recipients),
    };
  });
}

const TEMPLATE_SEEDS: Omit<CommunicationTemplate, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Welcome Message",
    type: "general",
    channels: ["email", "in_app"],
    title: "Welcome to Bagyes Rush",
    message: "Hi {{first_name}}, thanks for joining Bagyes Rush! Your first delivery is on us.",
    ctaLabel: "Place an order",
    audienceRoles: ["customer"],
    archived: false,
  },
  {
    name: "Payment Reminder",
    type: "notification",
    channels: ["push", "sms"],
    title: "Payment Reminder",
    message: "Hi {{first_name}}, your invoice {{invoice_id}} of {{amount}} is now due.",
    audienceRoles: ["customer"],
    archived: false,
  },
  {
    name: "Account Update",
    type: "system_update",
    channels: ["email"],
    title: "Your account details were updated",
    message: "Hi {{first_name}}, we're confirming a recent update to your account details.",
    audienceRoles: ["customer", "rider"],
    archived: false,
  },
  {
    name: "Maintenance Notice",
    type: "maintenance",
    channels: ["push", "email", "in_app"],
    title: "Scheduled Maintenance",
    message: "Our services will undergo scheduled maintenance tonight. Some features may be briefly unavailable.",
    audienceRoles: ["customer", "rider"],
    archived: false,
  },
  {
    name: "Promotional Message",
    type: "promotional",
    channels: ["push", "email"],
    title: "Special Offer Just for You",
    message: "Hi {{first_name}}, enjoy a limited-time discount on your next order.",
    ctaLabel: "Shop now",
    audienceRoles: ["customer"],
    archived: false,
  },
  {
    name: "Service Interruption",
    type: "announcement",
    channels: ["push", "sms", "in_app"],
    title: "Service Interruption",
    message: "We're experiencing a service interruption in your area. We're working to resolve it quickly.",
    audienceRoles: ["customer", "rider"],
    archived: false,
  },
  {
    name: "New Feature Announcement",
    type: "announcement",
    channels: ["in_app", "push"],
    title: "New Feature Available",
    message: "Check out the newest feature we just shipped for your account.",
    ctaLabel: "See what's new",
    audienceRoles: ["customer", "rider"],
    archived: true,
  },
];

function buildTemplates(): CommunicationTemplate[] {
  return TEMPLATE_SEEDS.map((seed, i) => ({
    ...seed,
    id: `TPL-${(100 + i).toString()}`,
    createdAt: daysAgo(30 + i * 4),
    updatedAt: daysAgo(2 + i),
  }));
}

const COMMUNICATIONS = buildCommunications();
const TEMPLATES = buildTemplates();

export const SCHEDULED_COMMUNICATIONS_COUNT = COMMUNICATIONS.filter((c) => c.status === "scheduled").length;

export async function getCommunications(): Promise<Communication[]> {
  return [...COMMUNICATIONS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getCommunicationById(id: string): Promise<Communication | undefined> {
  return COMMUNICATIONS.find((c) => c.id === id);
}

export async function getRecentCommunications(limit = 5): Promise<Communication[]> {
  return [...COMMUNICATIONS].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, limit);
}

export async function getScheduledCommunications(): Promise<Communication[]> {
  return COMMUNICATIONS.filter((c) => c.status === "scheduled").sort(
    (a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0)
  );
}

export async function getAnnouncements(): Promise<Communication[]> {
  return COMMUNICATIONS.filter((c) => c.type === "announcement").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getCommunicationTemplates(): Promise<CommunicationTemplate[]> {
  return TEMPLATES;
}

export type CommunicationsOverviewStats = {
  totalCommunications: number;
  sentToday: number;
  scheduled: number;
  failed: number;
  totalRecipients: number;
  engagementRatePercent: number;
};

export async function getCommunicationsOverviewStats(): Promise<CommunicationsOverviewStats> {
  const sentToday = COMMUNICATIONS.filter((c) => c.sentAt && c.sentAt.toDateString() === NOW.toDateString()).length;
  const scheduled = COMMUNICATIONS.filter((c) => c.status === "scheduled").length;
  const failed = COMMUNICATIONS.filter((c) => c.status === "failed").length;
  const totalRecipients = COMMUNICATIONS.reduce((sum, c) => sum + c.audience.resolvedCount, 0);

  let totalOpened = 0;
  let totalDelivered = 0;
  for (const c of COMMUNICATIONS) {
    for (const stat of Object.values(c.stats)) {
      totalDelivered += stat.delivered;
      totalOpened += stat.opened;
    }
  }

  return {
    totalCommunications: COMMUNICATIONS.length,
    sentToday,
    scheduled,
    failed,
    totalRecipients,
    engagementRatePercent: totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 1000) / 10 : 0,
  };
}

export async function getCommunicationsOverTime(): Promise<DayPoint[]> {
  const days = 14;
  const counts = new Array(days).fill(0);
  for (const c of COMMUNICATIONS) {
    const diff = Math.floor((NOW.getTime() - c.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    if (diff >= 0 && diff < days) counts[days - 1 - diff] += 1;
  }
  return counts.map((value, i) => ({
    date: daysAgo(days - 1 - i).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value,
  }));
}

export async function getChannelUsageBreakdown(): Promise<ChannelUsage[]> {
  const counts: Record<CommunicationChannel, number> = { push: 0, email: 0, sms: 0, in_app: 0 };
  for (const c of COMMUNICATIONS) {
    for (const channel of c.channels) counts[channel] += 1;
  }
  return (["push", "email", "sms", "in_app"] as CommunicationChannel[]).map((channel) => ({ channel, count: counts[channel] }));
}

export async function getAudienceDirectory(): Promise<AudienceDirectoryEntry[]> {
  const [riders, customers] = await Promise.all([getRiders(), getCustomers()]);
  return [
    ...riders.map((r) => ({ id: r.id, name: r.name, phone: r.phone, role: "rider" as const })),
    ...customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, role: "customer" as const })),
  ];
}

export async function getAudienceSegments(): Promise<AudienceSegment[]> {
  const [riders, customers] = await Promise.all([getRiders(), getCustomers()]);
  return [
    { id: "customer-active", label: "Active customers", role: "customer", count: customers.filter((c) => c.status === "active").length },
    { id: "customer-suspended", label: "Suspended customers", role: "customer", count: customers.filter((c) => c.status === "suspended").length },
    { id: "rider-available", label: "Available riders", role: "rider", count: riders.filter((r) => r.status === "available").length },
    { id: "rider-on-delivery", label: "Riders on delivery", role: "rider", count: riders.filter((r) => r.status === "on_delivery").length },
    { id: "rider-offline", label: "Offline riders", role: "rider", count: riders.filter((r) => r.status === "offline").length },
  ];
}
