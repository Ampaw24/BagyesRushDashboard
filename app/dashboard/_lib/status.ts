import type { TransactionStatus } from "../_services/mock-data";
import type {
  AdminRole,
  CommunicationStatus,
  DeliveryOfferStatus,
  OrderStatus,
  WithdrawalStatus,
  PaymentStatus,
  ParcelStopStatus,
  ReportStatus,
  RiderStatus,
  UserStatus,
  VendorStatus,
} from "@/lib/types/enums";
import {
  adminRoleLabels,
  COMMUNICATION_STATUS_LABELS,
  PARCEL_STOP_STATUS_LABELS,
  REPORT_STATUS_LABELS,
  deliveryOfferStatusLabels,
  orderStatusLabels,
  paymentStatusLabels,
  riderStatusLabels,
  vendorStatusLabels,
  withdrawalStatusLabels,
} from "@/lib/types/enums";
import type { RiderDerivedState } from "@/lib/mappers/rider.mapper";
import type { VendorDerivedState } from "@/lib/mappers/vendor.mapper";

// Re-exported so components can pull the status type and its badge meta from
// one place, as they did when these types were declared here.
export type { AdminRole, OrderStatus, PaymentStatus, RiderStatus, UserStatus, VendorStatus };


export type BadgeMeta = { label: string; dotClassName: string; badgeClassName: string };

/* Four reusable tones, so a new status never invents a new colour. */
const GOOD = { dotClassName: "bg-status-good", badgeClassName: "bg-status-good/10 text-status-good" };
const INFO = { dotClassName: "bg-status-info", badgeClassName: "bg-status-info/10 text-status-info" };
const WARN = {
  dotClassName: "bg-status-warning",
  badgeClassName: "bg-status-warning/10 text-amber-700 dark:text-amber-400",
};
const CRITICAL = {
  dotClassName: "bg-status-critical",
  badgeClassName: "bg-status-critical/10 text-status-critical",
};
const NEUTRAL = {
  dotClassName: "bg-zinc-400",
  badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
};

/**
 * All ten OrderStatus values from the backend enum. The dashboard previously
 * modelled only four; the sub-pages still surface those four, but the All
 * Orders filter and every badge now cover the real set.
 */
export const orderStatusMeta: Record<OrderStatus, BadgeMeta> = {
  pending_payment: { label: orderStatusLabels.pending_payment, ...NEUTRAL },
  pending: { label: orderStatusLabels.pending, ...WARN },
  accepted: { label: orderStatusLabels.accepted, ...INFO },
  preparing: { label: orderStatusLabels.preparing, ...INFO },
  ready: { label: orderStatusLabels.ready, ...INFO },
  out_for_delivery: { label: orderStatusLabels.out_for_delivery, ...INFO },
  delivered: { label: orderStatusLabels.delivered, ...GOOD },
  cancelled: { label: orderStatusLabels.cancelled, ...CRITICAL },
  rejected: { label: orderStatusLabels.rejected, ...CRITICAL },
  refunded: { label: orderStatusLabels.refunded, ...NEUTRAL },
};

export const vendorStatusMeta: Record<VendorStatus, BadgeMeta> = {
  pending_review: { label: vendorStatusLabels.pending_review, ...WARN },
  approved: { label: vendorStatusLabels.approved, ...GOOD },
  rejected: { label: vendorStatusLabels.rejected, ...CRITICAL },
  suspended: { label: vendorStatusLabels.suspended, ...CRITICAL },
};

/**
 * `status` plus `is_active` collapsed into one badge, which is what the vendor
 * sub-pages are organised around.
 */
export const vendorStateMeta: Record<VendorDerivedState, BadgeMeta> = {
  pending: { label: "Pending review", ...WARN },
  active: { label: "Active", ...GOOD },
  inactive: { label: "Inactive", ...NEUTRAL },
  suspended: { label: "Suspended", ...CRITICAL },
  rejected: { label: "Rejected", ...CRITICAL },
};

/** Document review state, from `documents_status`. */
export const documentsStatusMeta: Record<string, BadgeMeta> = {
  approved: { label: "Verified", ...GOOD },
  rejected: { label: "Rejected", ...CRITICAL },
  pending: { label: "Pending review", ...WARN },
  submitted: { label: "Submitted", ...INFO },
};

export const paymentStatusMeta: Record<PaymentStatus, BadgeMeta> = {
  pending: { label: paymentStatusLabels.pending, ...WARN },
  paid: { label: paymentStatusLabels.paid, ...GOOD },
  failed: { label: paymentStatusLabels.failed, ...CRITICAL },
  refunded: { label: paymentStatusLabels.refunded, ...NEUTRAL },
};

/**
 * Account state. The backend has exactly two values — the dashboard's former
 * active/disabled/banned and active/invited/suspended/removed sets had no
 * backend equivalent.
 */
export const userStatusMeta: Record<UserStatus, BadgeMeta> = {
  active: { label: "Active", ...GOOD },
  suspended: { label: "Suspended", ...CRITICAL },
};

/** Staff roles, matching app/Enums/AdminRole.php. */
export const adminRoleMeta: Record<AdminRole, { label: string }> = {
  super_admin: { label: adminRoleLabels.super_admin },
  manager: { label: adminRoleLabels.manager },
  support: { label: adminRoleLabels.support },
  finance: { label: adminRoleLabels.finance },
};

/** Promo code state, combining `is_active` with the scheduling window. */
export const promoCodeStateMeta: Record<"live" | "scheduled" | "expired" | "inactive", BadgeMeta> = {
  live: { label: "Live", ...GOOD },
  scheduled: { label: "Scheduled", ...INFO },
  expired: { label: "Expired", ...NEUTRAL },
  inactive: { label: "Inactive", ...NEUTRAL },
};

export const riderStatusMeta: Record<RiderStatus, BadgeMeta> = {
  pending_review: { label: riderStatusLabels.pending_review, ...WARN },
  approved: { label: riderStatusLabels.approved, ...GOOD },
  rejected: { label: riderStatusLabels.rejected, ...CRITICAL },
  suspended: { label: riderStatusLabels.suspended, ...CRITICAL },
};

/**
 * `status` plus `is_profile_complete` plus the soft-delete, collapsed into one
 * badge - which is what the rider sub-pages are organised around. A rider who
 * registered and never finished onboarding is not "pending review": there is
 * nothing to review yet.
 */
export const riderStateMeta: Record<RiderDerivedState, BadgeMeta> = {
  incomplete: { label: "Incomplete", ...NEUTRAL },
  pending: { label: "Pending review", ...WARN },
  approved: { label: "Approved", ...GOOD },
  rejected: { label: "Rejected", ...CRITICAL },
  suspended: { label: "Blocked", ...CRITICAL },
  deleted: { label: "Deleted", ...NEUTRAL },
};

/** Where a payout request has got to. */
export const withdrawalStatusMeta: Record<WithdrawalStatus, BadgeMeta> = {
  pending: { label: withdrawalStatusLabels.pending, ...WARN },
  approved: { label: withdrawalStatusLabels.approved, ...INFO },
  paid: { label: withdrawalStatusLabels.paid, ...GOOD },
  rejected: { label: withdrawalStatusLabels.rejected, ...CRITICAL },
  cancelled: { label: withdrawalStatusLabels.cancelled, ...NEUTRAL },
  // Critical, not neutral: money left and came back, and somebody has to work
  // out why before the rider asks.
  reversed: { label: withdrawalStatusLabels.reversed, ...CRITICAL },
};

/** The outcome of one job offer. */
export const deliveryOfferStatusMeta: Record<DeliveryOfferStatus, BadgeMeta> = {
  offered: { label: deliveryOfferStatusLabels.offered, ...INFO },
  accepted: { label: deliveryOfferStatusLabels.accepted, ...GOOD },
  declined: { label: deliveryOfferStatusLabels.declined, ...CRITICAL },
  // No response is the most common answer and reads differently from a refusal.
  expired: { label: deliveryOfferStatusLabels.expired, ...WARN },
  cancelled: { label: deliveryOfferStatusLabels.cancelled, ...NEUTRAL },
};

/** Whether a rider is switched on and taking jobs right now. */
export const riderPresenceMeta: Record<"online" | "offline", BadgeMeta> = {
  online: { label: "Online", ...GOOD },
  offline: { label: "Offline", ...NEUTRAL },
};

/* ---------------------------------------------------------------------- */
/* Below here: modules with no backend yet, still running on mock data.    */
/* ---------------------------------------------------------------------- */

export const transactionStatusMeta: Record<TransactionStatus, BadgeMeta> = {
  completed: { label: "Completed", ...GOOD },
  pending: { label: "Pending", ...WARN },
  failed: { label: "Failed", ...CRITICAL },
};

/**
 * Where a broadcast has got to.
 *
 * `partially_failed` reads as a warning rather than a failure: a send to
 * thousands is almost never wholly one thing or the other, and colouring it
 * critical would make a mostly-successful blast look like an outage.
 */
export const communicationStatusMeta: Record<CommunicationStatus, BadgeMeta> = {
  draft: { label: COMMUNICATION_STATUS_LABELS.draft, ...NEUTRAL },
  scheduled: { label: COMMUNICATION_STATUS_LABELS.scheduled, ...INFO },
  queued: { label: COMMUNICATION_STATUS_LABELS.queued, ...INFO },
  sending: { label: COMMUNICATION_STATUS_LABELS.sending, ...INFO },
  sent: { label: COMMUNICATION_STATUS_LABELS.sent, ...GOOD },
  partially_failed: { label: COMMUNICATION_STATUS_LABELS.partially_failed, ...WARN },
  failed: { label: COMMUNICATION_STATUS_LABELS.failed, ...CRITICAL },
  cancelled: { label: COMMUNICATION_STATUS_LABELS.cancelled, ...NEUTRAL },
};

/** Where a complaint has got to. Pending is a work item, not a neutral state. */
export const reportStatusMeta: Record<ReportStatus, BadgeMeta> = {
  pending: { label: REPORT_STATUS_LABELS.pending, ...WARN },
  in_review: { label: REPORT_STATUS_LABELS.in_review, ...INFO },
  resolved: { label: REPORT_STATUS_LABELS.resolved, ...GOOD },
  // Dismissed is a decision, not a failure - the complaint was looked at.
  dismissed: { label: REPORT_STATUS_LABELS.dismissed, ...NEUTRAL },
};

/** One drop on a parcel run. */
export const parcelStopStatusMeta: Record<ParcelStopStatus, BadgeMeta> = {
  pending: { label: PARCEL_STOP_STATUS_LABELS.pending, ...NEUTRAL },
  delivered: { label: PARCEL_STOP_STATUS_LABELS.delivered, ...GOOD },
  // The one package that did not arrive is the one somebody will ring about.
  failed: { label: PARCEL_STOP_STATUS_LABELS.failed, ...CRITICAL },
};
