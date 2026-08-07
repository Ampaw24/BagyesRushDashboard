"use client";

import { useOrdersFilter, type OrderStatusFilter } from "../_hooks/use-orders-filter";
import { OrderStatusBadge } from "../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { SearchIcon } from "../_lib/icons";
import { formatCurrency, formatDateTime } from "../_lib/format";
import type { Order } from "../_services/mock-data";

const STATUS_FILTERS: { value: OrderStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrdersTable({ orders, initialStatus = "all" }: { orders: Order[]; initialStatus?: OrderStatusFilter }) {
  const { query, setQuery, status, setStatus, filtered } = useOrdersFilter(orders, initialStatus);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order ID or customer"
            className="h-11 w-full rounded-lg border border-border-subtle bg-surface pl-9 pr-3.5 text-sm text-foreground outline-none transition duration-150 placeholder:text-text-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatusFilter)}
          className="h-11 rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">No orders match your filters</p>
          <p className="text-sm text-text-muted">Try a different search term or status.</p>
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Order</TableHeadCell>
              <TableHeadCell>Customer</TableHeadCell>
              <TableHeadCell>Address</TableHeadCell>
              <TableHeadCell>Rider</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Total</TableHeadCell>
              <TableHeadCell>Placed</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell className="text-text-secondary">{order.address}</TableCell>
                <TableCell className="text-text-secondary">{order.rider ?? "Unassigned"}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
                <TableCell className="text-text-secondary">{formatDateTime(order.placedAt)}</TableCell>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
