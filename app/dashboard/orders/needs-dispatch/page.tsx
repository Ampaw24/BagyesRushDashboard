import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { EmptyState, NoPermissionState } from "../../_components/empty-state";
import { OrdersTable } from "../orders-table";
import { listOrdersNeedingDispatch } from "@/lib/services/orders.service";
import { toOrderRow } from "@/lib/mappers/order.mapper";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Needs Dispatch — BagyesRUSH",
};

/**
 * Orders every ring of the broadcast failed to place with a rider.
 *
 * This is a work queue, not a report: each of these is a customer waiting for
 * food that currently has nobody bringing it, and somebody has to assign a
 * rider by hand. Ordered oldest-first server-side.
 */
export default async function NeedsDispatchPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "dispatch.manage")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Needs dispatch" description="Orders waiting on a rider." />
        <NoPermissionState what="the dispatch queue" />
      </div>
    );
  }

  const page = await listOrdersNeedingDispatch({ per_page: 50 });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Needs dispatch"
        description="No rider accepted these after every ring of the broadcast. Open one and assign somebody."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} waiting
          </span>
        }
      />

      {page.items.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          description="Every live order has a rider on it. Orders land here only when the broadcast runs out of rounds with no taker."
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
