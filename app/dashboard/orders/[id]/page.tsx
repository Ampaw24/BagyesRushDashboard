import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "../../_components/page-header";
import { MoneyBreakdown } from "./_components/money-breakdown";
import { Badge, OrderStatusBadge } from "../../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { NoPermissionState } from "../../_components/empty-state";
import { parcelStopStatusMeta, paymentStatusMeta } from "../../_lib/status";
import { formatCurrency, formatDateTime, formatDateTimeOrDash } from "../../_lib/format";
import { OrderActions } from "./_components/order-actions";
import { TrackingPanel } from "./_components/tracking-panel";
import { DispatchPanel } from "./_components/dispatch-panel";
import { FailedDeliveryBanner } from "./_components/failed-delivery-banner";
import { getOrder } from "@/lib/services/orders.service";
import { getConversationForOrder } from "@/lib/services/conversations.service";
import { listRiders } from "@/lib/services/riders.service";
import { toOrderDetail } from "@/lib/mappers/order.mapper";
import { toRiderRow } from "@/lib/mappers/rider.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { isNotFound } from "@/lib/api/errors";
import { unstable_rethrow } from "next/navigation";

export const metadata: Metadata = {
  title: "Order — BagyesRUSH",
};

export default async function OrderDetailPage(props: PageProps<"/dashboard/orders/[id]">) {
  const { id } = await props.params;
  const permissions = await getPermissions();

  if (!can(permissions, "orders.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Order" description="Order detail." />
        <NoPermissionState what="orders" />
      </div>
    );
  }

  const order = await loadOrder(Number(id));

  // Only fetched when the admin can actually act on it: the picker is the only
  // thing that uses it, and it is behind orders.assign_rider.
  const canAssignRider = can(permissions, "orders.assign_rider");

  const availableRiders =
    canAssignRider && can(permissions, "riders.view")
      ? await listRiders({ status: "approved", is_online: true, per_page: 50 }).then((page) =>
          page.items.map(toRiderRow),
        )
      : [];

  // What the customer and the rider actually said to each other, which is the
  // evidence a disputed delivery turns on. Looked up rather than created - the
  // admin endpoint deliberately does not open a thread, so reading an order
  // never makes a chat window appear on somebody's phone.
  const conversation = can(permissions, "chat.view")
    ? await getConversationForOrder(order.id).catch(() => null)
    : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.orderNumber}
            <OrderStatusBadge status={order.status} />
          </span>
        }
        description={`Placed ${formatDateTime(order.placedAt)}`}
        action={
          <OrderActions
            order={order}
            canUpdateStatus={can(permissions, "orders.update_status")}
            canRefund={can(permissions, "payments.refund")}
          />
        }
      />

      <FailedDeliveryBanner order={order} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InfoCard title="Customer">
          <InfoRow label="Name" value={order.customerName} />
          <InfoRow label="Email" value={order.customerEmail ?? "—"} />
          <InfoRow label="Phone" value={order.customerPhone ?? "—"} />
        </InfoCard>

        <InfoCard title="Vendor">
          <InfoRow
            label="Business"
            value={
              order.vendorId ? (
                <Link
                  href={`/dashboard/vendors/${order.vendorId}`}
                  className="text-brand transition duration-150 hover:opacity-80"
                >
                  {order.vendorName ?? `Vendor #${order.vendorId}`}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <InfoRow label="Phone" value={order.vendorPhone ?? "—"} />
        </InfoCard>

        <InfoCard title="Delivery">
          <InfoRow label="Recipient" value={order.recipientName} />
          <InfoRow label="Phone" value={order.recipientPhone} />
          <InfoRow label="Address" value={order.address} />
          <InfoRow
            label="Rider"
            value={order.rider ? (order.rider.name ?? order.rider.phone) : "Unassigned"}
          />
          {conversation && (
            <InfoRow
              label="Chat"
              value={
                <Link
                  href={`/dashboard/conversations/${conversation.id}`}
                  className="text-brand transition duration-150 hover:opacity-80"
                >
                  Read the conversation
                  {typeof conversation.message_count === "number" &&
                    ` (${conversation.message_count})`}
                </Link>
              }
            />
          )}
          {order.parcel?.deliveryInstructions && (
            <InfoRow label="Instructions" value={order.parcel.deliveryInstructions} />
          )}
        </InfoCard>

        {/* A parcel has no kitchen and no line items — what it is, and where it
            is being collected from, is the equivalent information. */}
        {order.parcel && (
          <InfoCard title="Parcel">
            <InfoRow label="Contents" value={order.parcel.itemDescription} />
            <InfoRow
              label="Size"
              value={
                order.parcel.isFragile
                  ? `${order.parcel.sizeLabel} · fragile`
                  : order.parcel.sizeLabel
              }
            />
            <InfoRow label="Quantity" value={String(order.parcel.quantity)} />
            {order.parcel.declaredValue !== null && (
              <InfoRow
                label="Declared value"
                value={formatCurrency(order.parcel.declaredValue)}
              />
            )}
            {order.parcel.stopCount > 1 && (
              <InfoRow label="Stops" value={`${order.parcel.stopCount} drops on this run`} />
            )}
            {order.parcel.totalWeightKg !== null && (
              <InfoRow
                label="Weight"
                value={`${order.parcel.totalWeightKg} kg (customer's figure)`}
              />
            )}
            <InfoRow label="Pick up from" value={order.parcel.pickupAddress} />
            <InfoRow
              label="Pickup contact"
              value={
                order.parcel.pickupContactName
                  ? `${order.parcel.pickupContactName}${order.parcel.pickupContactPhone ? ` · ${order.parcel.pickupContactPhone}` : ""}`
                  : (order.parcel.pickupContactPhone ?? "—")
              }
            />
            {order.parcel.pickupInstructions && (
              <InfoRow label="Pickup notes" value={order.parcel.pickupInstructions} />
            )}
          </InfoCard>
        )}
      </div>

      <DispatchPanel order={order} availableRiders={availableRiders} canAssign={canAssignRider} />

      {order.stops.length > 1 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">
              Itinerary
            </h2>
            <span className="text-sm text-text-muted">
              {order.stops.filter((stop) => !stop.isOpen).length} of {order.stops.length} answered
            </span>
          </div>

          <ol className="flex flex-col gap-3">
            {order.stops.map((stop) => (
              <li
                key={stop.id}
                className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <span className="flex items-baseline gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-text-secondary">
                      {stop.sequence}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{stop.address}</span>
                      <span className="text-xs text-text-muted">
                        {stop.recipientName ?? "No named recipient"}
                        {stop.recipientPhone ? ` · ${stop.recipientPhone}` : ""}
                      </span>
                    </span>
                  </span>
                  <Badge meta={parcelStopStatusMeta[stop.status]} />
                </div>

                <p className="text-sm text-text-secondary">{stop.summary}</p>

                {stop.instructions && (
                  <p className="text-xs text-text-muted">&ldquo;{stop.instructions}&rdquo;</p>
                )}

                {/* The one package that did not arrive is the one somebody
                    will ring about, so the reason is not buried. */}
                {stop.failureReason && (
                  <p className="rounded-lg bg-status-critical/10 p-2 text-xs text-status-critical">
                    {stop.failureReason}
                  </p>
                )}

                {stop.deliveredAt && (
                  <p className="text-xs text-text-muted">
                    Delivered {formatDateTime(stop.deliveredAt)}
                    {stop.deliveredToName ? ` to ${stop.deliveredToName}` : ""}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Only while it is actually moving: a map of a delivered order shows
          where somebody used to be. */}
      {(order.status === "out_for_delivery" || order.status === "ready" || order.status === "accepted") && (
        <TrackingPanel order={order} />
      )}

      {(order.rejectionReason || order.cancellationReason || order.notes) && (
        <div className="flex flex-col gap-3">
          {order.notes && <NoteBox label="Customer notes" body={order.notes} />}
          {order.rejectionReason && <NoteBox label="Rejection reason" body={order.rejectionReason} critical />}
          {order.cancellationReason && (
            <NoteBox label="Cancellation reason" body={order.cancellationReason} critical />
          )}
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">
          {order.isParcel ? "Charges" : "Items"}
        </h2>

        {/* A parcel has nothing to itemise — the whole bill is delivery plus
            the service fee, and the breakdown below still reconciles. */}
        {!order.isParcel && (
        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Item</TableHeadCell>
              <TableHeadCell>Category</TableHeadCell>
              <TableHeadCell>Unit price</TableHeadCell>
              <TableHeadCell>Qty</TableHeadCell>
              <TableHeadCell>Line total</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <TableCell className="font-medium">
                  {item.name}
                  {item.options.length > 0 && (
                    <span className="mt-1 block text-xs font-normal text-text-muted">
                      {item.options.map((option) => `${option.groupName}: ${option.name}`).join(", ")}
                    </span>
                  )}
                  {item.notes && (
                    <span className="mt-1 block text-xs font-normal text-text-muted">“{item.notes}”</span>
                  )}
                </TableCell>
                <TableCell className="text-text-secondary">{item.categoryName ?? "—"}</TableCell>
                <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{formatCurrency(item.lineTotal)}</TableCell>
              </tr>
            ))}
          </tbody>
        </TableShell>
        )}

      </section>

      <MoneyBreakdown order={order} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">Timeline</h2>
          <ol className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
            {order.timeline.map((step) => (
              <li key={step.status} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2.5">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      step.at ? "bg-status-good" : "bg-zinc-300 dark:bg-zinc-600"
                    }`}
                  />
                  <span className={step.at ? "text-foreground" : "text-text-muted"}>{step.label}</span>
                </span>
                <span className="text-text-muted">{formatDateTimeOrDash(step.at)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="flex flex-wrap items-center gap-3 break-words text-lg font-semibold tracking-tight text-foreground">
            Payment
            <Badge meta={paymentStatusMeta[order.paymentStatus]} />
          </h2>

          {order.attempts.length === 0 ? (
            <p className="rounded-xl border border-border-subtle bg-surface p-5 text-sm text-text-muted shadow-sm">
              No payment attempts recorded.
            </p>
          ) : (
            <TableShell>
              <thead>
                <tr>
                  <TableHeadCell>Reference</TableHeadCell>
                  <TableHeadCell>Provider</TableHeadCell>
                  <TableHeadCell>Amount</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Paid</TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {order.attempts.map((attempt) => (
                  <tr key={attempt.reference}>
                    <TableCell className="font-medium">{attempt.reference}</TableCell>
                    <TableCell className="text-text-secondary">{attempt.provider}</TableCell>
                    <TableCell>{formatCurrency(attempt.amount)}</TableCell>
                    <TableCell>
                      <Badge meta={paymentStatusMeta[attempt.status]} />
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {formatDateTimeOrDash(attempt.paidAt)}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * The admin services throw ValidationException for a missing record, so a
 * bad id arrives as a 422 with `errors.order` rather than a 404.
 */
async function loadOrder(id: number) {
  if (!Number.isFinite(id)) notFound();

  try {
    return toOrderDetail(await getOrder(id));
  } catch (error) {
    unstable_rethrow(error);
    if (isNotFound(error, "order")) notFound();
    throw error;
  }
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <h3 className="break-words text-sm font-semibold text-foreground">{title}</h3>
      <dl className="flex flex-col gap-2">{children}</dl>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="break-words text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}


function NoteBox({ label, body, critical }: { label: string; body: string; critical?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-4 text-sm ${
        critical
          ? "border-status-critical/30 bg-status-critical/5"
          : "border-border-subtle bg-surface"
      }`}
    >
      <p className="font-medium text-foreground">{label}</p>
      <p className="break-words text-text-secondary">{body}</p>
    </div>
  );
}
