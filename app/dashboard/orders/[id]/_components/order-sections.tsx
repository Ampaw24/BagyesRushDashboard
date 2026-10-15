import { Badge } from "../../../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../../../_components/table-shell";
import { orderPaymentMeta, parcelStopStatusMeta, paymentStatusMeta } from "../../../_lib/status";
import { formatCurrency, formatDateTime, formatDateTimeOrDash } from "../../../_lib/format";
import type { OrderDetail, ParcelDetail } from "@/lib/mappers/order.mapper";

/**
 * The pieces of one order, shared by the full page and the quick-view dialog.
 *
 * They lived inside the page until the dialog needed them. Two copies of "who
 * hands a parcel over" would drift the first time either was corrected, and the
 * one support reads during a call is the one that would be wrong.
 *
 * None of these hold state, so they render from a Server Component and a Client
 * Component alike.
 */

export function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <h3 className="break-words text-sm font-semibold text-foreground">{title}</h3>
      <dl className="flex flex-col gap-2">{children}</dl>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
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

/** The customer's notes and, when it ended badly, why. Renders nothing otherwise. */
export function OrderNotes({ order }: { order: OrderDetail }) {
  if (!order.rejectionReason && !order.cancellationReason && !order.notes) return null;

  return (
    <div className="flex flex-col gap-3">
      {order.notes && <NoteBox label="Customer notes" body={order.notes} />}
      {order.rejectionReason && (
        <NoteBox label="Rejection reason" body={order.rejectionReason} critical />
      )}
      {order.cancellationReason && (
        <NoteBox label="Cancellation reason" body={order.cancellationReason} critical />
      )}
    </div>
  );
}

export function CustomerCard({ order }: { order: OrderDetail }) {
  return (
    <InfoCard title={order.parcel ? "Customer (booked and paid)" : "Customer"}>
      <InfoRow label="Name" value={order.customerName} />
      <InfoRow label="Email" value={order.customerEmail ?? "—"} />
      <InfoRow label="Phone" value={order.customerPhone ?? "—"} />
    </InfoCard>
  );
}

/**
 * Who is delivering, and for food, to whom. `extra` is where the page hangs
 * the chat link — the dialog has its own way to reach the thread.
 */
export function DeliveryCard({ order, extra }: { order: OrderDetail; extra?: React.ReactNode }) {
  return (
    <InfoCard title={order.parcel ? "Rider" : "Delivery"}>
      {!order.parcel && (
        <>
          <InfoRow label="Recipient" value={order.recipientName} />
          <InfoRow label="Phone" value={order.recipientPhone} />
          <InfoRow label="Address" value={order.address} />
        </>
      )}
      <InfoRow
        label="Rider"
        value={order.rider ? (order.rider.name ?? order.rider.phone) : "Unassigned"}
      />
      {extra}
      {order.parcel?.deliveryInstructions && (
        <InfoRow label="Instructions" value={order.parcel.deliveryInstructions} />
      )}
    </InfoCard>
  );
}

/**
 * A parcel has no kitchen and no line items — what it is, and where it is
 * being collected from, is the equivalent information.
 */
export function ParcelCard({ parcel }: { parcel: ParcelDetail }) {
  return (
    <InfoCard title="Parcel">
      <InfoRow
        label="Direction"
        value={
          parcel.direction === "receive"
            ? `${parcel.directionLabel} · collected from someone else for the customer`
            : `${parcel.directionLabel} · the customer is sending it`
        }
      />
      <InfoRow label="Contents" value={parcel.itemDescription} />
      <InfoRow
        label="Size"
        value={parcel.isFragile ? `${parcel.sizeLabel} · fragile` : parcel.sizeLabel}
      />
      <InfoRow label="Quantity" value={String(parcel.quantity)} />
      {parcel.declaredValue !== null && (
        <InfoRow label="Declared value" value={formatCurrency(parcel.declaredValue)} />
      )}
      {parcel.stopCount > 1 && (
        <InfoRow label="Stops" value={`${parcel.stopCount} drops on this run`} />
      )}
      {parcel.totalWeightKg !== null && (
        <InfoRow label="Weight" value={`${parcel.totalWeightKg} kg (customer's figure)`} />
      )}
    </InfoCard>
  );
}

/**
 * Who hands a parcel over and who takes it.
 *
 * The two swap with the direction. On a send, the customer is at the pickup
 * and each stop's recipient receives. On a receive, a third party - the pickup
 * contact, who has no app - hands it over and the customer receives at the
 * drop. Showing only "the recipient" left half of every receive parcel's
 * people off the page, and the half support most often needs to phone.
 */
export function ParcelPartyCards({ order, parcel }: { order: OrderDetail; parcel: ParcelDetail }) {
  const receiving = parcel.direction === "receive";

  const contact = (name: string | null, phone: string | null) =>
    name ? `${name}${phone ? ` · ${phone}` : ""}` : (phone ?? "—");

  return (
    <>
      <InfoCard title="Sender">
        {receiving ? (
          <>
            <InfoRow label="Name" value={parcel.pickupContactName ?? "—"} />
            <InfoRow label="Phone" value={parcel.pickupContactPhone ?? "—"} />
            <InfoRow label="Role" value="Hands it over (has no app)" />
          </>
        ) : (
          <>
            <InfoRow label="Name" value={order.customerName} />
            <InfoRow label="Phone" value={order.customerPhone ?? "—"} />
            <InfoRow label="Role" value="The customer" />
          </>
        )}
        <InfoRow label="Pick up from" value={parcel.pickupAddress} />
        {parcel.pickupInstructions && (
          <InfoRow label="Pickup notes" value={parcel.pickupInstructions} />
        )}
      </InfoCard>

      <InfoCard title={!receiving && order.stops.length > 1 ? "Receivers" : "Receiver"}>
        {receiving ? (
          <>
            <InfoRow label="Name" value={order.customerName} />
            <InfoRow label="Phone" value={order.customerPhone ?? "—"} />
            <InfoRow label="Role" value="The customer" />
            <InfoRow label="Deliver to" value={order.address} />
          </>
        ) : order.stops.length > 1 ? (
          // One person per drop on a multi-stop run; the itinerary has the
          // full detail and status of each.
          order.stops.map((stop) => (
            <InfoRow
              key={stop.id}
              label={`Stop ${stop.sequence}`}
              value={`${contact(stop.recipientName, stop.recipientPhone)} · ${stop.address}`}
            />
          ))
        ) : (
          <>
            <InfoRow label="Name" value={order.stops[0]?.recipientName ?? order.recipientName} />
            <InfoRow
              label="Phone"
              value={order.stops[0]?.recipientPhone ?? order.recipientPhone}
            />
            <InfoRow label="Deliver to" value={order.stops[0]?.address ?? order.address} />
          </>
        )}
        {parcel.deliveryInstructions && (
          <InfoRow label="Instructions" value={parcel.deliveryInstructions} />
        )}
      </InfoCard>
    </>
  );
}

/** Every drop on a multi-stop parcel run. Renders nothing for a single drop. */
export function ParcelItinerary({ order }: { order: OrderDetail }) {
  if (order.stops.length <= 1) return null;

  return (
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

            {/* The one package that did not arrive is the one somebody will
                ring about, so the reason is not buried. */}
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
  );
}

/**
 * The basket. A parcel has nothing to itemise — the whole bill is delivery
 * plus the service fee, and the money breakdown still reconciles — so it
 * renders nothing there.
 */
export function OrderItemsTable({ order }: { order: OrderDetail }) {
  if (order.isParcel) return null;

  return (
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
                <span className="mt-1 block text-xs font-normal text-text-muted">
                  “{item.notes}”
                </span>
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
  );
}

export function OrderTimeline({ order }: { order: OrderDetail }) {
  return (
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
  );
}

export function OrderPayments({ order }: { order: OrderDetail }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex flex-wrap items-center gap-3 break-words text-lg font-semibold tracking-tight text-foreground">
        Payment
        <Badge meta={orderPaymentMeta(order)} />
      </h2>

      {order.tender && (
        <p className="break-words text-sm text-text-secondary">{order.tender.label}</p>
      )}

      {order.attempts.length === 0 && !order.tender?.usedWallet ? (
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
            {/* Wallet credit is taken when the order is placed and never goes
                through the gateway, so it has no attempt row of its own.
                Without this line an order paid entirely from the wallet showed
                an empty table. */}
            {order.tender?.usedWallet && (
              <tr>
                <TableCell className="font-medium">Wallet credit</TableCell>
                <TableCell className="text-text-secondary">In-app wallet</TableCell>
                <TableCell>{formatCurrency(order.tender.fromWallet)}</TableCell>
                <TableCell>
                  <Badge meta={paymentStatusMeta.paid} />
                </TableCell>
                <TableCell className="text-text-secondary">
                  {formatDateTimeOrDash(order.placedAt)}
                </TableCell>
              </tr>
            )}
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
  );
}
