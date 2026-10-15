import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "../../_components/page-header";
import { RecordExportButton } from "../../_components/record-export-button";
import { orderRecord } from "@/lib/export/records";
import { MoneyBreakdown } from "./_components/money-breakdown";
import { OrderStatusBadge } from "../../_components/status-badge";
import { NoPermissionState } from "../../_components/empty-state";
import { formatDateTime } from "../../_lib/format";
import { OrderActions } from "./_components/order-actions";
import { TrackingPanel } from "./_components/tracking-panel";
import { DispatchPanel } from "./_components/dispatch-panel";
import { FailedDeliveryBanner } from "./_components/failed-delivery-banner";
import {
  CustomerCard,
  DeliveryCard,
  InfoCard,
  InfoRow,
  OrderItemsTable,
  OrderNotes,
  OrderPayments,
  OrderTimeline,
  ParcelCard,
  ParcelItinerary,
  ParcelPartyCards,
} from "./_components/order-sections";
import { ConversationQuickViewLink } from "../../conversations/_components/conversation-quick-view-link";
import { OrderHistory } from "../_components/order-history";
import { loadOrderHistory } from "../_lib/order-history";
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

  // Who did what to this order. Needs `audit.view`; without it the section is
  // left out rather than shown empty, which would read as "nobody touched it".
  // An audit-log failure loses the section, never the order page.
  const history = can(permissions, "audit.view")
    ? await loadOrderHistory(order.id, conversation?.id ?? null).catch(() => null)
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
          <div className="flex flex-wrap items-center gap-3">
            {/* Built here, on the server, and passed as a plain object: a
                build function cannot cross into a client component, and this
                page is a server component. */}
            <RecordExportButton record={orderRecord(order)} />
            <OrderActions
              order={order}
              canUpdateStatus={can(permissions, "orders.update_status")}
              canRefund={can(permissions, "payments.refund")}
            />
          </div>
        }
      />

      <FailedDeliveryBanner
        order={order}
        canResolve={can(permissions, "orders.update_status")}
        canRefund={can(permissions, "payments.refund")}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CustomerCard order={order} />

        {/* A parcel has no vendor. What support needs instead is who hands it
            over and who takes it - and which way round depends on whether the
            customer is sending or receiving. */}
        {order.parcel ? (
          <ParcelPartyCards order={order} parcel={order.parcel} />
        ) : (
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
        )}

        <DeliveryCard
          order={order}
          extra={
            conversation && (
              <InfoRow
                label="Chat"
                value={
                  <ConversationQuickViewLink
                    conversationId={conversation.id}
                    className="text-brand transition duration-150 hover:opacity-80"
                  >
                    Read the conversation
                    {typeof conversation.message_count === "number" &&
                      ` (${conversation.message_count})`}
                  </ConversationQuickViewLink>
                }
              />
            )
          }
        />

        {order.parcel && <ParcelCard parcel={order.parcel} />}
      </div>

      <DispatchPanel order={order} availableRiders={availableRiders} canAssign={canAssignRider} />

      <ParcelItinerary order={order} />

      {/* Only while it is actually moving: a map of a delivered order shows
          where somebody used to be. */}
      {(order.status === "out_for_delivery" ||
        order.status === "ready" ||
        order.status === "accepted") && <TrackingPanel order={order} />}

      <OrderNotes order={order} />

      {!order.isParcel && (
        <section className="flex flex-col gap-4">
          <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">
            Items
          </h2>
          <OrderItemsTable order={order} />
        </section>
      )}

      <MoneyBreakdown order={order} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <OrderTimeline order={order} />
        <OrderPayments order={order} />
      </div>

      {history && (
        <section className="flex flex-col gap-4">
          <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">
            History
          </h2>
          <OrderHistory entries={history} />
        </section>
      )}
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
