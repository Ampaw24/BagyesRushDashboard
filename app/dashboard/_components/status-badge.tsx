import {
  orderStatusMeta,
  riderPresenceMeta,
  riderStateMeta,
  riderStatusMeta,
  type OrderStatus,
  type RiderStatus,
} from "../_lib/status";
import type { RiderDerivedState } from "@/lib/mappers/rider.mapper";

type BadgeMeta = { label: string; dotClassName: string; badgeClassName: string };

export function Badge({ meta }: { meta: BadgeMeta }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badgeClassName}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClassName}`} />
      {meta.label}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge meta={orderStatusMeta[status]} />;
}

export function RiderStatusBadge({ status }: { status: RiderStatus }) {
  return <Badge meta={riderStatusMeta[status]} />;
}

/** The sub-page badge: status, onboarding progress and the soft-delete in one. */
export function RiderStateBadge({ state }: { state: RiderDerivedState }) {
  return <Badge meta={riderStateMeta[state]} />;
}

/** Whether the rider is switched on right now — orthogonal to their status. */
export function RiderPresenceBadge({ online }: { online: boolean }) {
  return <Badge meta={riderPresenceMeta[online ? "online" : "offline"]} />;
}
