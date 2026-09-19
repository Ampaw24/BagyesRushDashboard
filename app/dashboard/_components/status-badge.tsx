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

/**
 * A status pill.
 *
 * `pulse` is for states that are genuinely in motion right now - an order out
 * for delivery, a rider online. It is deliberately not wired to every "good"
 * tone: if everything pulses, nothing reads as live.
 */
export function Badge({ meta, pulse = false }: { meta: BadgeMeta; pulse?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badgeClassName}`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {pulse ? (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${meta.dotClassName}`}
          />
        ) : null}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${meta.dotClassName}`} />
      </span>
      {meta.label}
    </span>
  );
}

/** Statuses where something is physically happening to the order right now. */
const LIVE_ORDER_STATUSES: readonly OrderStatus[] = ["preparing", "ready", "out_for_delivery"];

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge meta={orderStatusMeta[status]} pulse={LIVE_ORDER_STATUSES.includes(status)} />;
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
  // A rider who is on right now is the one case where a pulsing dot is
  // telling the truth rather than decorating.
  return <Badge meta={riderPresenceMeta[online ? "online" : "offline"]} pulse={online} />;
}
