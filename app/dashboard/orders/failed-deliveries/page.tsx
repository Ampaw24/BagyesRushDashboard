import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { EmptyState, NoPermissionState } from "../../_components/empty-state";
import { OrdersTable } from "../orders-table";
import { listFailedDeliveries } from "@/lib/services/orders.service";
import { toOrderRow } from "@/lib/mappers/order.mapper";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Failed Deliveries — BagyesRUSH",
};

/**
 * Deliveries the rider gave up on at the door.
 *
 * These fell through every crack until now. `giveUpWaiting()` stamps the order
 * for manual attention, but the dispatch queue filters on orders with *no*
 * rider — and an abandoned delivery still has one, because they are physically
 * holding the food. So an order that was paid for and never delivered appeared
 * on no screen at all, and the only trace was a push notification to the
 * customer that somebody had to happen to see.
 *
 * A work queue, not a report: each row is a customer who paid for something
 * they never received. Oldest first, server-side.
 */
export default async function FailedDeliveriesPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "orders.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Failed deliveries"
          description="Orders the rider could not hand over."
        />
        <NoPermissionState what="failed deliveries" />
      </div>
    );
  }

  const page = await listFailedDeliveries({ per_page: 50 });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Failed deliveries"
        description="The rider arrived, waited out the countdown and left without handing over. Each of these needs a decision: refund, reassign, or mark it delivered if the customer collected it."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} waiting
          </span>
        }
      />

      {page.items.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          description="Orders land here when a rider starts the wait timer at the door, the countdown runs out and they leave. None are open."
        />
      ) : (
        <OrdersTable
          orders={page.items.map(toOrderRow)}
          pagination={page.pagination}
          showStatusFilter={false}
        />
      )}
    </div>
  );
}
