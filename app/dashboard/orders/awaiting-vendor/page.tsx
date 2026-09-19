import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { EmptyState, NoPermissionState } from "../../_components/empty-state";
import { OrdersTable } from "../orders-table";
import { listOrdersAwaitingVendor } from "@/lib/services/orders.service";
import { toOrderRow } from "@/lib/mappers/order.mapper";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Awaiting Vendor — BagyesRUSH",
};

/**
 * Paid orders the kitchen has not answered.
 *
 * The third order queue, and the one that had no screen. Needs Dispatch is "no
 * rider took it"; Failed Deliveries is "the rider reached the door and could
 * not hand it over". This is neither — dispatch does not begin until `ready`,
 * so an unanswered order never reaches either of them. The customer's money is
 * taken and the vendor is simply not looking.
 *
 * Nothing lands here on its own: `orders:chase-unaccepted` reminds the vendor
 * first and only escalates to this queue if they still have not answered, so
 * every row is an order somebody has already been nudged about. That is why the
 * action is to phone them rather than wait.
 *
 * A work queue, not a report. Oldest first, server-side.
 */
export default async function AwaitingVendorPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "orders.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Awaiting vendor" description="Paid orders the kitchen has not answered." />
        <NoPermissionState what="the vendor queue" />
      </div>
    );
  }

  const page = await listOrdersAwaitingVendor({ per_page: 50 });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Awaiting vendor"
        description="Paid for, and the kitchen still has not accepted. They have already been reminded — somebody needs to call them, or cancel and refund."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} waiting
          </span>
        }
      />

      {page.items.length === 0 ? (
        <EmptyState
          title="Every kitchen is answering"
          description="Orders land here only after a vendor has been reminded and still has not accepted. Nothing is overdue right now."
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
