import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "../../_components/page-header";
import { Badge, OrderStatusBadge } from "../../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { NoPermissionState } from "../../_components/empty-state";
import { paymentStatusMeta } from "../../_lib/status";
import { formatCurrency, formatDateTime, formatDateTimeOrDash } from "../../_lib/format";
import { OrderActions } from "./_components/order-actions";
import { getOrder } from "@/lib/services/orders.service";
import { toOrderDetail } from "@/lib/mappers/order.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { isNotFound } from "@/lib/api/errors";
import { unstable_rethrow } from "next/navigation";

export const metadata: Metadata = {
  title: "Order — Bagyes Rush Delivery",
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
          {/* AdminOrderResource exposes a rider id and phone, never a name. */}
          <InfoRow label="Rider" value={order.riderPhone ?? "Unassigned"} />
        </InfoCard>
      </div>

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
        <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">Items</h2>
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

        <dl className="ml-auto flex w-full max-w-xs flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-5 text-sm shadow-sm">
          <TotalRow label="Subtotal" value={formatCurrency(order.subtotal)} />
          <TotalRow label="Delivery fee" value={formatCurrency(order.deliveryFee)} />
          {order.discount > 0 && <TotalRow label="Discount" value={`−${formatCurrency(order.discount)}`} />}
          <div className="mt-1 border-t border-border-subtle pt-2">
            <TotalRow label="Total" value={formatCurrency(order.total)} strong />
          </div>
        </dl>
      </section>

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

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className={strong ? "font-semibold text-foreground" : "text-text-muted"}>{label}</dt>
      <dd className={strong ? "font-semibold text-foreground" : "font-medium text-foreground"}>{value}</dd>
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
