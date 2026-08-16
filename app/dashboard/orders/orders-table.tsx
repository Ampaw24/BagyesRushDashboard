import Link from "next/link";

import { Badge, OrderStatusBadge } from "../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { EmptyState } from "../_components/empty-state";
import { Pagination } from "../_components/pagination";
import { FilterBar, type SelectFilter } from "../_components/filter-bar";
import { paymentStatusMeta } from "../_lib/status";
import { formatCurrency, formatDateTime } from "../_lib/format";
import type { OrderRow } from "@/lib/mappers/order.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import { ORDER_STATUSES, PAYMENT_STATUSES, orderStatusLabels, paymentStatusLabels } from "@/lib/types/enums";

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "All statuses",
  options: ORDER_STATUSES.map((status) => ({ value: status, label: orderStatusLabels[status] })),
};

const PAYMENT_FILTER: SelectFilter = {
  key: "payment_status",
  label: "Payment",
  allLabel: "All payments",
  options: PAYMENT_STATUSES.map((status) => ({ value: status, label: paymentStatusLabels[status] })),
};

/**
 * Server component: the API has already filtered, sorted and paginated. The
 * filter controls and pager are the only client pieces, and they work by
 * writing to the URL.
 */
export function OrdersTable({
  orders,
  pagination,
  /** Omitted on the status-specific sub-pages, where the status is fixed by the route. */
  showStatusFilter = true,
}: {
  orders: OrderRow[];
  pagination: PaginationMeta;
  showStatusFilter?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchPlaceholder="Search order number, recipient or phone"
        filters={showStatusFilter ? [STATUS_FILTER, PAYMENT_FILTER] : [PAYMENT_FILTER]}
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders match your filters"
          description="Try a different search term, status or date range."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Order</TableHeadCell>
                <TableHeadCell>Customer</TableHeadCell>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell>Address</TableHeadCell>
                <TableHeadCell>Rider</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Payment</TableHeadCell>
                <TableHeadCell>Total</TableHeadCell>
                <TableHeadCell>Placed</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-brand transition duration-150 hover:opacity-80"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell className="text-text-secondary">{order.vendorName ?? "—"}</TableCell>
                  <TableCell className="text-text-secondary">{order.address}</TableCell>
                  {/* The API exposes a rider phone but no rider name. */}
                  <TableCell className="text-text-secondary">{order.riderPhone ?? "Unassigned"}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <Badge meta={paymentStatusMeta[order.paymentStatus]} />
                  </TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell className="text-text-secondary">{formatDateTime(order.placedAt)}</TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}
    </div>
  );
}
