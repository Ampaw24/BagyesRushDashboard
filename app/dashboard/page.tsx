import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "./_components/page-header";
import { StatTile } from "./_components/stat-tile";
import { Meter } from "./_components/meter";
import { OrderStatusBadge } from "./_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "./_components/table-shell";
import { CheckCircleIcon, ChevronRightIcon, OrdersIcon, RidersIcon, WalletIcon } from "./_lib/icons";
import { formatCompactNumber, formatCurrency, formatDateTime } from "./_lib/format";
import { getOverviewStats, getRecentOrders } from "./_services/mock-data";

export const metadata: Metadata = {
  title: "Overview — Bagyes Rush Delivery",
};

export default async function OverviewPage() {
  const [stats, recentOrders] = await Promise.all([getOverviewStats(), getRecentOrders(5)]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Overview" description="Track deliveries, riders, and revenue in real time." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Active deliveries"
          value={formatCompactNumber(stats.activeDeliveries.value)}
          icon={<OrdersIcon className="h-4.5 w-4.5" />}
          deltaPercent={stats.activeDeliveries.deltaPercent}
          trend={stats.activeDeliveries.trend}
        />
        <StatTile
          label="Riders online"
          value={formatCompactNumber(stats.ridersOnline.value)}
          icon={<RidersIcon className="h-4.5 w-4.5" />}
          deltaPercent={stats.ridersOnline.deltaPercent}
          trend={stats.ridersOnline.trend}
        />
        <StatTile
          label="Revenue today"
          value={formatCurrency(stats.revenueToday.value)}
          icon={<WalletIcon className="h-4.5 w-4.5" />}
          deltaPercent={stats.revenueToday.deltaPercent}
          trend={stats.revenueToday.trend}
        />
        <Meter label="Completion rate" value={stats.completionRate.value} icon={<CheckCircleIcon className="h-4.5 w-4.5" />} />
      </div>

      <div className="flex flex-col gap-4">
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

        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Order</TableHeadCell>
              <TableHeadCell>Customer</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Total</TableHeadCell>
              <TableHeadCell>Placed</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
                <TableCell className="text-text-secondary">{formatDateTime(order.placedAt)}</TableCell>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}
