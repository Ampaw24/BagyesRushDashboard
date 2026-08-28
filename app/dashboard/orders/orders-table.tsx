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
import {
  ORDER_STATUSES,
  ORDER_TYPES,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUSES,
  orderStatusLabels,
  paymentStatusLabels,
} from "@/lib/types/enums";

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "All statuses",
  options: ORDER_STATUSES.map((status) => ({ value: status, label: orderStatusLabels[status] })),
};

/**
 * Food and parcels share this board — a parcel is an order with no vendor — so
 * the type is a filter rather than a separate screen. A customer's history is
 * one list, and so is an admin's.
 */
const TYPE_FILTER: SelectFilter = {
  key: "type",
  label: "Type",
  allLabel: "Food and parcels",
  options: ORDER_TYPES.map((type) => ({ value: type, label: ORDER_TYPE_LABELS[type] })),
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
        filters={
          showStatusFilter
            ? [STATUS_FILTER, TYPE_FILTER, PAYMENT_FILTER]
            : [TYPE_FILTER, PAYMENT_FILTER]
        }
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
                    <span className="flex flex-col gap-0.5">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-brand transition duration-150 hover:opacity-80"
                      >
                        {order.orderNumber}
                      </Link>
                      {/* Only parcels are labelled: food is the default and
                          tagging every row would be noise. */}
                      {order.isParcel && (
                        <span className="text-xs font-normal text-text-muted">
                          {order.typeLabel}
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell className="text-text-secondary">
                    {/* A parcel has no kitchen, which is why vendor_id is
                        nullable — say so rather than showing a bare dash. */}
                    {order.vendorName ?? (order.isParcel ? "No vendor" : "—")}
                  </TableCell>
                  <TableCell className="text-text-secondary">{order.address}</TableCell>
                  <TableCell className="text-text-secondary">
                    {order.riderName ?? order.riderPhone ?? "Unassigned"}
                  </TableCell>
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
