import { formatDateTime } from "../../../_lib/format";
import { ResolveDeliveryButton } from "./resolve-delivery-dialog";
import type { OrderDetail } from "@/lib/mappers/order.mapper";

/**
 * The rider waited, nobody came, and they left.
 *
 * This state was previously invisible. The order simply stayed `out_for
 * delivery` with no explanation on any screen, and the only trace that anything
 * had gone wrong was a push notification to the customer. An admin looking at
 * the order saw a delivery in progress that was never going to progress.
 *
 * Deliberately loud and deliberately at the top, because it is not a fact about
 * the order — it is a job. Somebody has to decide, through "Resolve delivery":
 * customer no-show (or return to sender for a parcel), try again, or our fault.
 *
 * Once decided, the banner becomes a quiet record of what was decided.
 */
export function FailedDeliveryBanner({
  order,
  canResolve,
  canRefund,
}: {
  order: OrderDetail;
  canResolve: boolean;
  canRefund: boolean;
}) {
  if (!order.arrival.needsResolution) {
    const resolution = order.arrival.resolution;
    if (!resolution) return null;

    return (
      <section className="flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
        <h2 className="break-words text-sm font-semibold text-foreground">
          Failed delivery resolved: {resolution.label}
        </h2>
        <p className="break-words text-sm text-text-secondary">
          {resolution.resolvedAt ? `Decided ${formatDateTime(resolution.resolvedAt)}.` : null}
          {resolution.note ? ` ${resolution.note}` : null}
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-status-critical/40 bg-status-critical/5 p-5">
      <h2 className="break-words text-sm font-semibold text-foreground">
        The rider gave up waiting and left
      </h2>

      <p className="break-words text-sm text-text-secondary">
        {order.arrival.failureReason ?? "The customer could not be reached."}
        {order.arrival.failedAt && ` Recorded ${formatDateTime(order.arrival.failedAt)}.`}
      </p>

      <dl className="mt-1 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-text-muted">Arrived at the door</dt>
          <dd className="font-medium text-foreground">
            {order.arrival.arrivedAt ? formatDateTime(order.arrival.arrivedAt) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Distance from the address</dt>
          <dd className="font-medium text-foreground">
            {order.arrival.distanceMetres !== null
              ? `${order.arrival.distanceMetres} m`
              : "Not checked"}
            {!order.arrival.verified && (
              <span className="mt-0.5 block text-xs font-normal text-text-muted">
                {/* Unverified means the destination had no coordinates to
                    measure against, not that the rider was caught out. */}
                No coordinates on the destination, so the arrival could not be
                checked against it.
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Payment</dt>
          <dd className="font-medium text-foreground">
            {order.isPaid ? "Paid, not refunded" : "Not paid"}
          </dd>
        </div>
      </dl>

      <p className="mt-1 break-words text-sm text-text-secondary">
        The order is still assigned to {order.rider?.name ?? "the rider"}, who is holding it.
        Decide what happens: the customer did not show
        {order.isParcel ? " (the parcel goes back to the sender)" : ""}, try the delivery again, or
        it was our fault and the customer is refunded.
      </p>

      {canResolve && <ResolveDeliveryButton order={order} canRefund={canRefund} />}
    </section>
  );
}
