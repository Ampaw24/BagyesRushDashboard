import type {
  AdminRole,
  AdminStatus,
  CouponStatus,
  CustomerStatus,
  TicketPriority,
  TicketStatus,
  TransactionStatus,
} from "../_services/mock-data";

export type OrderStatus = "pending" | "in_transit" | "delivered" | "cancelled";
export type RiderStatus = "available" | "on_delivery" | "offline";

export type BadgeMeta = { label: string; dotClassName: string; badgeClassName: string };

export const orderStatusMeta: Record<OrderStatus, BadgeMeta> = {
  pending: {
    label: "Pending",
    dotClassName: "bg-status-warning",
    badgeClassName: "bg-status-warning/10 text-amber-700 dark:text-amber-400",
  },
  in_transit: {
    label: "In transit",
    dotClassName: "bg-status-info",
    badgeClassName: "bg-status-info/10 text-status-info",
  },
  delivered: {
    label: "Delivered",
    dotClassName: "bg-status-good",
    badgeClassName: "bg-status-good/10 text-status-good",
  },
  cancelled: {
    label: "Cancelled",
    dotClassName: "bg-status-critical",
    badgeClassName: "bg-status-critical/10 text-status-critical",
  },
};

export const riderStatusMeta: Record<RiderStatus, BadgeMeta> = {
  available: {
    label: "Available",
    dotClassName: "bg-status-good",
    badgeClassName: "bg-status-good/10 text-status-good",
  },
  on_delivery: {
    label: "On delivery",
    dotClassName: "bg-status-info",
    badgeClassName: "bg-status-info/10 text-status-info",
  },
  offline: {
    label: "Offline",
    dotClassName: "bg-zinc-400",
    badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
  },
};

export const couponStatusMeta: Record<CouponStatus, BadgeMeta> = {
  active: {
    label: "Active",
    dotClassName: "bg-status-good",
    badgeClassName: "bg-status-good/10 text-status-good",
  },
  scheduled: {
    label: "Scheduled",
    dotClassName: "bg-status-info",
    badgeClassName: "bg-status-info/10 text-status-info",
  },
  expired: {
    label: "Expired",
    dotClassName: "bg-zinc-400",
    badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
  },
};

export const transactionStatusMeta: Record<TransactionStatus, BadgeMeta> = {
  completed: {
    label: "Completed",
    dotClassName: "bg-status-good",
    badgeClassName: "bg-status-good/10 text-status-good",
  },
  pending: {
    label: "Pending",
    dotClassName: "bg-status-warning",
    badgeClassName: "bg-status-warning/10 text-amber-700 dark:text-amber-400",
  },
  failed: {
    label: "Failed",
    dotClassName: "bg-status-critical",
    badgeClassName: "bg-status-critical/10 text-status-critical",
  },
};

export const customerStatusMeta: Record<CustomerStatus, BadgeMeta> = {
  active: {
    label: "Active",
    dotClassName: "bg-status-good",
    badgeClassName: "bg-status-good/10 text-status-good",
  },
  suspended: {
    label: "Suspended",
    dotClassName: "bg-status-critical",
    badgeClassName: "bg-status-critical/10 text-status-critical",
  },
};

export const ticketStatusMeta: Record<TicketStatus, BadgeMeta> = {
  open: {
    label: "Open",
    dotClassName: "bg-status-critical",
    badgeClassName: "bg-status-critical/10 text-status-critical",
  },
  pending: {
    label: "Pending",
    dotClassName: "bg-status-warning",
    badgeClassName: "bg-status-warning/10 text-amber-700 dark:text-amber-400",
  },
  resolved: {
    label: "Resolved",
    dotClassName: "bg-status-good",
    badgeClassName: "bg-status-good/10 text-status-good",
  },
};

export const ticketPriorityMeta: Record<TicketPriority, BadgeMeta> = {
  high: {
    label: "High",
    dotClassName: "bg-status-critical",
    badgeClassName: "bg-status-critical/10 text-status-critical",
  },
  medium: {
    label: "Medium",
    dotClassName: "bg-status-warning",
    badgeClassName: "bg-status-warning/10 text-amber-700 dark:text-amber-400",
  },
  low: {
    label: "Low",
    dotClassName: "bg-zinc-400",
    badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
  },
};

export const adminRoleMeta: Record<AdminRole, { label: string }> = {
  super_admin: { label: "Super admin" },
  admin: { label: "Admin" },
  support_staff: { label: "Support staff" },
};

export const adminStatusMeta: Record<AdminStatus, BadgeMeta> = {
  active: {
    label: "Active",
    dotClassName: "bg-status-good",
    badgeClassName: "bg-status-good/10 text-status-good",
  },
  invited: {
    label: "Invited",
    dotClassName: "bg-status-info",
    badgeClassName: "bg-status-info/10 text-status-info",
  },
  suspended: {
    label: "Suspended",
    dotClassName: "bg-status-critical",
    badgeClassName: "bg-status-critical/10 text-status-critical",
  },
  removed: {
    label: "Removed",
    dotClassName: "bg-zinc-400",
    badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
  },
};
