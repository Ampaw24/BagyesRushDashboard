import { orderStatusMeta, riderStatusMeta, type OrderStatus, type RiderStatus } from "../_lib/status";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = orderStatusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badgeClassName}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClassName}`} />
      {meta.label}
    </span>
  );
}

export function RiderStatusBadge({ status }: { status: RiderStatus }) {
  const meta = riderStatusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badgeClassName}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClassName}`} />
      {meta.label}
    </span>
  );
}
