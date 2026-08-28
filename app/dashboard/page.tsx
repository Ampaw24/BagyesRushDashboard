import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "./_components/page-header";
import { StatTile } from "./_components/stat-tile";
import { Meter } from "./_components/meter";
import { DistributionBar, type DistributionSegment } from "./_components/distribution-bar";
import { OrderStatusBadge } from "./_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "./_components/table-shell";
import { EmptyState } from "./_components/empty-state";
import { orderStatusMeta } from "./_lib/status";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  OrdersIcon,
  RidersIcon,
  ShopIcon,
  UsersIcon,
  WalletIcon,
} from "./_lib/icons";
import {
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatDateTime,
} from "./_lib/format";
import { getDashboard } from "@/lib/services/dashboard.service";
import { listOrders } from "@/lib/services/orders.service";
import { toOrderRow } from "@/lib/mappers/order.mapper";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types/enums";

export const metadata: Metadata = {
  title: "Overview — BagyesRUSH",
};

/**
 * The backend exposes aggregates, not time series: DashboardService returns
 * totals for today / 7d / 30d / all time, but there is no per-day endpoint.
 * The two trend charts this page used to show were driven entirely by mock
 * data, so they are gone rather than fabricated.
 */

/** Tailwind classes for the status distribution bar, in the enum's own order. */
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: "bg-zinc-400",
  pending: "bg-status-warning",
  accepted: "bg-status-info",
  preparing: "bg-status-info/80",
  ready: "bg-status-info/60",
  out_for_delivery: "bg-brand",
  delivered: "bg-status-good",
  cancelled: "bg-status-critical",
  rejected: "bg-status-critical/70",
  refunded: "bg-zinc-500",
};

export default async function OverviewPage() {
  const [dashboard, recentOrdersPage] = await Promise.all([
    getDashboard(),
    listOrders({ per_page: 5 }),
  ]);

  const recentOrders = recentOrdersPage.items.map(toOrderRow);

  // Present only when the admin also holds `payments.view`; a support admin
  // gets the operational counters without any money figures.
  const money = dashboard.all_time;
  const today = dashboard.today;

  const statusSegments: DistributionSegment[] = ORDER_STATUSES.filter(
    (status) => (dashboard.orders.by_status[status] ?? 0) > 0,
  ).map((status) => ({
    key: status,
    label: orderStatusMeta[status].label,
    value: dashboard.orders.by_status[status] ?? 0,
    colorClassName: STATUS_COLORS[status],
  }));

  const totalOrders = ORDER_STATUSES.reduce(
    (sum, status) => sum + (dashboard.orders.by_status[status] ?? 0),
    0,
  );

  const liveOrders =
    (dashboard.orders.by_status.accepted ?? 0) +
    (dashboard.orders.by_status.preparing ?? 0) +
    (dashboard.orders.by_status.ready ?? 0) +
    (dashboard.orders.by_status.out_for_delivery ?? 0);

  const completionRate =
    money && money.orders > 0 ? (money.delivered / money.orders) * 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Overview"
        description="Live marketplace activity across orders, vendors, riders and customers."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Orders in progress"
          value={formatCompactNumber(liveOrders)}
          icon={<OrdersIcon className="h-4.5 w-4.5" />}
        />
        <StatTile
          label="Vendors open now"
          value={formatCompactNumber(dashboard.vendors.open_now)}
          icon={<ShopIcon className="h-4.5 w-4.5" />}
        />
        <StatTile
          label="Customers"
          value={formatCompactNumber(dashboard.customers.total)}
          icon={<UsersIcon className="h-4.5 w-4.5" />}
        />
        <StatTile
          label="Total riders"
          // The online count is the one that decides whether an order can
          // actually be dispatched, so it rides along rather than needing
          // its own screen.
          value={formatCompactNumber(dashboard.riders?.total ?? 0)}
          hint={`${formatCompactNumber(dashboard.riders?.online ?? 0)} online now`}
          icon={<RidersIcon className="h-4.5 w-4.5" />}
        />
        <StatTile
          label="Total users"
          value={formatCompactNumber(dashboard.users?.total ?? 0)}
          hint={`${formatCompactNumber(dashboard.users?.new_this_week ?? 0)} new this week`}
          icon={<UsersIcon className="h-4.5 w-4.5" />}
        />
        {money ? (
          <StatTile
            label="Revenue today"
            value={formatCompactCurrency(today?.revenue ?? 0)}
            icon={<WalletIcon className="h-4.5 w-4.5" />}
          />
        ) : (
          <Meter
            label="Vendors approved"
            value={
              dashboard.vendors.total > 0
                ? (dashboard.vendors.approved / dashboard.vendors.total) * 100
                : 0
            }
            icon={<CheckCircleIcon className="h-4.5 w-4.5" />}
          />
        )}
      </div>

      {money && today && (
        <section className="flex flex-col gap-4">
          <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">Trading</h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <PeriodCard title="Today" period={today} />
            {dashboard.last_7_days && <PeriodCard title="Last 7 days" period={dashboard.last_7_days} />}
            {dashboard.last_30_days && <PeriodCard title="Last 30 days" period={dashboard.last_30_days} />}
            <PeriodCard title="All time" period={money} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Collected all time"
              value={formatCompactCurrency(dashboard.payments?.collected_all_time ?? 0)}
              icon={<WalletIcon className="h-4.5 w-4.5" />}
            />
            <StatTile
              label="Refunded all time"
              value={formatCompactCurrency(dashboard.payments?.refunded_all_time ?? 0)}
              icon={<WalletIcon className="h-4.5 w-4.5" />}
            />
            <Meter
              label="Gateway success rate"
              value={dashboard.payments?.gateway_success_rate ?? 0}
              icon={<CheckCircleIcon className="h-4.5 w-4.5" />}
            />
            <Meter
              label="Delivery completion rate"
              value={completionRate}
              icon={<CheckCircleIcon className="h-4.5 w-4.5" />}
            />
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">Orders by status</h2>
          <span className="text-sm text-text-muted">{totalOrders.toLocaleString()} orders total</span>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          {statusSegments.length > 0 ? (
            <DistributionBar segments={statusSegments} ariaLabel="Orders by status" />
          ) : (
            <p className="text-sm text-text-muted">No orders yet.</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Awaiting vendor"
            value={formatCompactNumber(dashboard.orders.by_status.pending ?? 0)}
            icon={<OrdersIcon className="h-4.5 w-4.5" />}
          />
          <StatTile
            label="Abandoned checkouts"
            value={formatCompactNumber(dashboard.orders.abandoned_checkouts)}
            icon={<OrdersIcon className="h-4.5 w-4.5" />}
          />
          <StatTile
            label="Awaiting refund"
            value={formatCompactNumber(dashboard.orders.awaiting_refund)}
            icon={<WalletIcon className="h-4.5 w-4.5" />}
          />
          <StatTile
            label="Vendors pending review"
            value={formatCompactNumber(dashboard.vendors.pending_review)}
            icon={<ShopIcon className="h-4.5 w-4.5" />}
          />
        </div>
      </section>

      {dashboard.top_vendors && dashboard.top_vendors.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">
            Top vendors
            <span className="ml-2 text-sm font-normal text-text-muted">Last 30 days</span>
          </h2>

          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell>Orders</TableHeadCell>
                <TableHeadCell>Revenue</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {dashboard.top_vendors.map((vendor) => (
                <tr key={vendor.vendor_id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/vendors/${vendor.vendor_id}`}
                      className="text-brand transition duration-150 hover:opacity-80"
                    >
                      {vendor.name ?? `Vendor #${vendor.vendor_id}`}
                    </Link>
                  </TableCell>
                  <TableCell>{vendor.orders.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(vendor.revenue)}</TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">Recent orders</h2>
          <Link
            href="/dashboard/orders"
            className="flex min-h-11 items-center gap-1 text-sm font-medium text-brand transition duration-150 hover:opacity-80"
          >
            View all
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <EmptyState title="No orders yet" description="Orders will appear here as customers check out." />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Order</TableHeadCell>
                <TableHeadCell>Customer</TableHeadCell>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Total</TableHeadCell>
                <TableHeadCell>Placed</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
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
      </section>
    </div>
  );
}

function PeriodCard({
  title,
  period,
}: {
  title: string;
  period: { orders: number; delivered: number; cancelled: number; revenue: number; average_order_value: number };
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <p className="break-words text-sm font-medium text-text-secondary">{title}</p>
      <p className="text-2xl font-semibold tracking-tight text-foreground">
        {formatCompactCurrency(period.revenue)}
      </p>
      <dl className="flex flex-col gap-1 text-sm text-text-muted">
        <div className="flex items-center justify-between gap-2">
          <dt>Orders</dt>
          <dd className="font-medium text-foreground">{period.orders.toLocaleString()}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt>Delivered</dt>
          <dd className="font-medium text-foreground">{period.delivered.toLocaleString()}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt>Cancelled</dt>
          <dd className="font-medium text-foreground">{period.cancelled.toLocaleString()}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt>Avg. order</dt>
          <dd className="font-medium text-foreground">{formatCurrency(period.average_order_value)}</dd>
        </div>
      </dl>
    </div>
  );
}
