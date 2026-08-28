"use client";

import { useState } from "react";

import { Badge } from "../../../_components/status-badge";
import { EmptyState } from "../../../_components/empty-state";
import { TableCell, TableHeadCell, TableShell } from "../../../_components/table-shell";
import { useToast } from "../../../_components/toast-provider";
import { deliveryOfferStatusMeta } from "../../../_lib/status";
import { formatCurrency, formatDateTimeOrDash } from "../../../_lib/format";
import { assignRiderAction } from "../../_actions";
import type { OrderDetail } from "@/lib/mappers/order.mapper";
import type { RiderRow } from "@/lib/mappers/rider.mapper";
import { vehicleTypeLabels } from "@/lib/types/enums";

/**
 * Who is carrying this order, who was asked, and the manual override.
 *
 * The offer history is the part that matters when an order is stuck: "nobody
 * took it" and "nobody was ever asked" look identical from the outside, and
 * only this table tells them apart.
 */
export function DispatchPanel({
  order,
  availableRiders,
  canAssign,
}: {
  order: OrderDetail;
  /** Approved riders who are online now. Empty without `riders.view`. */
  availableRiders: RiderRow[];
  canAssign: boolean;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">Dispatch</h2>
        {order.dispatch.needsManualDispatchAt && !order.rider && (
          <span className="rounded-full bg-status-critical/10 px-3 py-1 text-xs font-medium text-status-critical">
            No rider accepted · waiting since{" "}
            {formatDateTimeOrDash(order.dispatch.needsManualDispatchAt)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RiderCard order={order} />

        {canAssign && (
          <AssignCard
            order={order}
            riders={availableRiders}
            // Reassigning mid-journey would leave the food with the first
            // rider and the job with the second.
            locked={order.dispatch.pickedUpAt !== null}
          />
        )}
      </div>

      {order.dispatch.offers.length === 0 ? (
        <EmptyState
          title="No offers were made"
          description="Either the order has not reached the kitchen's ready step yet, or no rider was online and in range when it did."
        />
      ) : (
        <TableShell>
          <caption className="px-1 pb-3 text-left text-xs text-text-muted">
            A ring is one round of offers, widening outward until somebody
            accepts. The distance is how far each rider was from the pickup when
            asked &mdash; not how far the order itself travels.
          </caption>
          <thead>
            <tr>
              <TableHeadCell>Ring</TableHeadCell>
              <TableHeadCell>Outcome</TableHeadCell>
              <TableHeadCell>Rider was from pickup</TableHeadCell>
              <TableHeadCell>Rider would earn</TableHeadCell>
              <TableHeadCell>Offered</TableHeadCell>
              <TableHeadCell>Answered</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {order.dispatch.offers.map((offer) => (
              <tr key={offer.id}>
                <TableCell className="font-medium">{offer.round}</TableCell>
                <TableCell>
                  <Badge meta={deliveryOfferStatusMeta[offer.status]} />
                </TableCell>
                <TableCell className="text-text-secondary">
                  {(offer.distanceMeters / 1000).toFixed(1)} km
                </TableCell>
                <TableCell className="tabular-nums text-text-secondary">
                  {formatCurrency(offer.earning)}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {formatDateTimeOrDash(offer.offeredAt)}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {formatDateTimeOrDash(offer.respondedAt)}
                </TableCell>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </section>
  );
}

function RiderCard({ order }: { order: OrderDetail }) {
  if (!order.rider) {
    return (
      <Card title="Rider">
        <p className="text-sm text-text-muted">
          Nobody has accepted this delivery yet.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Rider">
      <Row label="Name" value={order.rider.name ?? "—"} />
      <Row label="Phone" value={order.rider.phone} />
      <Row
        label="Vehicle"
        value={
          order.rider.vehicleType
            ? `${vehicleTypeLabels[order.rider.vehicleType]}${order.rider.plateNumber ? ` · ${order.rider.plateNumber}` : ""}`
            : "—"
        }
      />
      <Row label="Accepted" value={formatDateTimeOrDash(order.dispatch.assignedAt)} />
      <Row label="Reached pickup" value={formatDateTimeOrDash(order.dispatch.arrivedAtPickup)} />
      <Row label="Collected" value={formatDateTimeOrDash(order.dispatch.pickedUpAt)} />
    </Card>
  );
}

function AssignCard({
  order,
  riders,
  locked,
}: {
  order: OrderDetail;
  riders: RiderRow[];
  locked: boolean;
}) {
  const [riderId, setRiderId] = useState<string>("");
  const [pending, setPending] = useState(false);
  const { notifySuccess } = useToast();

  async function assign() {
    if (!riderId) return;

    setPending(true);
    const result = await assignRiderAction(order.id, Number(riderId));
    setPending(false);
    notifySuccess(result);
  }

  return (
    <Card title={order.rider ? "Reassign" : "Assign a rider"}>
      {locked ? (
        <p className="text-sm text-text-muted">
          This order has already been collected. Reassigning now would leave the food with one rider
          and the job with another — contact the rider instead.
        </p>
      ) : riders.length === 0 ? (
        <p className="text-sm text-text-muted">
          No approved riders are online right now. They appear here as soon as one goes on shift.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-secondary">
            Assigning by hand skips the offer flow. Any outstanding offers are withdrawn and the
            rider is notified straight away.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={riderId}
              onChange={(event) => setRiderId(event.target.value)}
              className="h-11 min-w-56 flex-1 rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground focus:border-brand focus:ring-4 focus:ring-brand/10"
            >
              <option value="">Choose a rider…</option>
              {riders.map((rider) => (
                <option key={rider.id} value={rider.userId}>
                  {rider.name}
                  {rider.plateNumber ? ` · ${rider.plateNumber}` : ""}
                  {rider.city ? ` · ${rider.city}` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={assign}
              disabled={!riderId || pending}
              className="h-11 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:opacity-50"
            >
              {pending ? "Assigning…" : "Assign"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <h3 className="break-words text-sm font-semibold text-foreground">{title}</h3>
      <dl className="flex flex-col gap-2">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="break-words text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
