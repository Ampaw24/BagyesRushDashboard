export type OrderStatus = "pending" | "in_transit" | "delivered" | "cancelled";
export type RiderStatus = "available" | "on_delivery" | "offline";

export const orderStatusMeta: Record<
  OrderStatus,
  { label: string; dotClassName: string; badgeClassName: string }
> = {
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

export const riderStatusMeta: Record<
  RiderStatus,
  { label: string; dotClassName: string; badgeClassName: string }
> = {
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
