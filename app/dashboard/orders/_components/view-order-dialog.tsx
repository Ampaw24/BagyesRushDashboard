"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DetailDialog, DialogTabs } from "../../_components/detail-dialog";
import { OrderStatusBadge } from "../../_components/status-badge";
import { RecordExportButton } from "../../_components/record-export-button";
import { formatDateTime } from "../../_lib/format";
import { orderRecord } from "@/lib/export/records";
import { MoneyBreakdown } from "../[id]/_components/money-breakdown";
import { OrderActions } from "../[id]/_components/order-actions";
import { DispatchPanel } from "../[id]/_components/dispatch-panel";
import { FailedDeliveryBanner } from "../[id]/_components/failed-delivery-banner";
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
} from "../[id]/_components/order-sections";
import { ConversationQuickViewLink } from "../../conversations/_components/conversation-quick-view-link";
import { OrderHistory } from "./order-history";
import { loadOrderQuickViewAction, type OrderQuickView } from "../_actions";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "money", label: "Items & money" },
  { key: "dispatch", label: "Dispatch" },
  { key: "history", label: "Timeline & payment" },
  { key: "staff", label: "History" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * One order, without leaving whatever list it was opened from.
 *
 * Support works orders as a queue — awaiting vendor, needs dispatch, failed at
 * the door — and every round trip to the order page cost the filters and the
 * scroll position of the queue being worked. Everything that decides an order
 * is here, and so is everything that acts on it: status, refund, resolving a
 * failed delivery and assigning a rider. Each action re-reads the order, so
 * the dialog never shows the state from before the click - and the History tab
 * shows the entry for it, naming who took it.
 *
 * The live tracking map stays on the full page: it polls, and a map is an
 * investigation rather than a glance.
 */
export function ViewOrderDialog({
  orderId,
  orderNumber,
  onClose,
}: {
  orderId: number;
  /** Shown while the order loads, when the opener already knows it. */
  orderNumber?: string;
  onClose: () => void;
}) {
  const [view, setView] = useState<OrderQuickView | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("overview");
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    let active = true;

    loadOrderQuickViewAction(orderId).then((result) => {
      if (!active) return;
      if (result.ok) {
        setView(result.data);
        setError("");
      } else {
        setError(result.message);
      }
    });

    return () => {
      active = false;
    };
  }, [orderId, version]);

  const order = view?.order ?? null;
  const permissions = view?.permissions;

  return (
    <DetailDialog
      label="View order"
      onClose={onClose}
      className="max-w-5xl"
      header={
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="flex flex-wrap items-center gap-3 break-words text-base font-semibold text-foreground">
            {order?.orderNumber ?? orderNumber ?? `Order #${orderId}`}
            {order && <OrderStatusBadge status={order.status} />}
          </h2>
          <span className="break-words text-xs text-text-muted">
            {order
              ? `${order.typeLabel} · placed ${formatDateTime(order.placedAt)}`
              : "Loading order…"}
          </span>
        </div>
      }
      footer={
        <>
          <RecordExportButton build={() => orderRecord(order!)} disabled={!order} />
          {order && permissions && (permissions.canUpdateStatus || permissions.canRefund) && (
            <OrderActions
              order={order}
              canUpdateStatus={permissions.canUpdateStatus}
              canRefund={permissions.canRefund}
              onChanged={reload}
            />
          )}
          <Link
            href={`/dashboard/orders/${orderId}`}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            Open full page
          </Link>
        </>
      }
    >
      {error && !order ? (
        <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
          {error}
        </p>
      ) : !order || !view ? (
        <p className="py-10 text-center text-sm text-text-muted">Loading order…</p>
      ) : (
        <>
          {/* Above the tabs: a failed doorstep is somebody's job, not a fact
              to be found on the third tab. */}
          <FailedDeliveryBanner
            order={order}
            canResolve={view.permissions.canUpdateStatus}
            canRefund={view.permissions.canRefund}
            onResolved={reload}
          />

          <DialogTabs
            // History needs `audit.view`; without it the tab is left out
            // rather than shown empty, which would read as "nobody touched it".
            tabs={view.history ? TABS : TABS.filter((entry) => entry.key !== "staff")}
            active={tab}
            onChange={setTab}
          />

          {tab === "overview" && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CustomerCard order={order} />

                {order.parcel ? (
                  <ParcelPartyCards order={order} parcel={order.parcel} />
                ) : (
                  <InfoCard title="Vendor">
                    <InfoRow label="Business" value={order.vendorName ?? "—"} />
                    <InfoRow label="Phone" value={order.vendorPhone ?? "—"} />
                  </InfoCard>
                )}

                <DeliveryCard
                  order={order}
                  extra={
                    view.conversation && (
                      <InfoRow
                        label="Chat"
                        value={
                          <ConversationQuickViewLink
                            conversationId={view.conversation.id}
                            className="text-brand transition duration-150 hover:opacity-80"
                          >
                            Read the conversation
                            {view.conversation.messageCount !== null &&
                              ` (${view.conversation.messageCount})`}
                          </ConversationQuickViewLink>
                        }
                      />
                    )
                  }
                />

                {order.parcel && <ParcelCard parcel={order.parcel} />}
              </div>

              <ParcelItinerary order={order} />
              <OrderNotes order={order} />
            </>
          )}

          {tab === "money" && (
            <>
              <OrderItemsTable order={order} />
              <MoneyBreakdown order={order} />
            </>
          )}

          {tab === "dispatch" && (
            <DispatchPanel
              order={order}
              availableRiders={view.availableRiders}
              canAssign={view.permissions.canAssignRider}
              onAssigned={reload}
            />
          )}

          {tab === "history" && (
            <>
              <OrderTimeline order={order} />
              <OrderPayments order={order} />
            </>
          )}

          {tab === "staff" && view.history && <OrderHistory entries={view.history} />}
        </>
      )}
    </DetailDialog>
  );
}
