import type { TicketPriority, TicketStatus, TransactionStatus } from "../_services/mock-data";
import type {
  AdminRole,
  OrderStatus,
  PaymentStatus,
  UserStatus,
  VendorStatus,
} from "@/lib/types/enums";
import { adminRoleLabels, orderStatusLabels, paymentStatusLabels, vendorStatusLabels } from "@/lib/types/enums";
import type { VendorDerivedState } from "@/lib/mappers/vendor.mapper";

// Re-exported so components can pull the status type and its badge meta from
// one place, as they did when these types were declared here.
export type { AdminRole, OrderStatus, PaymentStatus, UserStatus, VendorStatus };

export type RiderStatus = "available" | "on_delivery" | "offline";

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

/* ---------------------------------------------------------------------- */
/* Below here: modules with no backend yet, still running on mock data.    */
/* ---------------------------------------------------------------------- */

export const riderStatusMeta: Record<RiderStatus, BadgeMeta> = {
  available: { label: "Available", ...GOOD },
  on_delivery: { label: "On delivery", ...INFO },
  offline: { label: "Offline", ...NEUTRAL },
};

export const transactionStatusMeta: Record<TransactionStatus, BadgeMeta> = {
  completed: { label: "Completed", ...GOOD },
  pending: { label: "Pending", ...WARN },
  failed: { label: "Failed", ...CRITICAL },
};

export const ticketStatusMeta: Record<TicketStatus, BadgeMeta> = {
  open: { label: "Open", ...CRITICAL },
  pending: { label: "Pending", ...WARN },
  resolved: { label: "Resolved", ...GOOD },
};

export const ticketPriorityMeta: Record<TicketPriority, BadgeMeta> = {
  high: { label: "High", ...CRITICAL },
  medium: { label: "Medium", ...WARN },
  low: { label: "Low", ...NEUTRAL },
};
