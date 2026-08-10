import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "./_components/page-header";
import { StatTile } from "./_components/stat-tile";
import { Meter } from "./_components/meter";
import { ChartCard } from "./_components/chart-card";
import { LineChart } from "./_components/line-chart";
import { BarChart } from "./_components/bar-chart";
import { StackedBarChart } from "./_components/stacked-bar-chart";
import { OrderStatusBadge } from "./_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "./_components/table-shell";
import { orderStatusMeta } from "./_lib/status";
import {
  AnalyticsIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  OrdersIcon,
  RidersIcon,
  WalletIcon,
} from "./_lib/icons";
import { formatCompactNumber, formatCurrency, formatDateTime } from "./_lib/format";
import {
  getDeliveryTrend,
  getOrderStatusBreakdown,
  getOverviewStats,
  getRecentOrders,
  getRevenueTrend,
} from "./_services/mock-data";

export const metadata: Metadata = {
  title: "Overview — Bagyes Rush Delivery",
};

export default async function OverviewPage() {
  const [stats, recentOrders, deliveryTrend, revenueTrend, statusBreakdown] = await Promise.all([
    getOverviewStats(),
    getRecentOrders(5),
    getDeliveryTrend(),
    getRevenueTrend(),
    getOrderStatusBreakdown(),
  ]);

  const totalOrders = statusBreakdown.reduce((sum, d) => sum + d.count, 0);

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
        <div className="flex items-center gap-2">
          <AnalyticsIcon className="h-4.5 w-4.5 text-text-muted" />
          <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">Analytics</h2>
          <span className="text-sm text-text-muted">Last 14 days</span>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Deliveries per day"
            subtitle="Last 14 days"
            chart={<LineChart data={deliveryTrend} unit="count" unitLabel="deliveries" />}
            table={
              <TableShell>
                <thead>
                  <tr>
                    <TableHeadCell>Date</TableHeadCell>
                    <TableHeadCell>Deliveries</TableHeadCell>
                  </tr>
                </thead>
                <tbody>
                  {deliveryTrend.map((d) => (
                    <tr key={d.date}>
                      <TableCell>{d.date}</TableCell>
                      <TableCell>{d.value}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            }
          />

          <ChartCard
            title="Revenue per day"
            subtitle="Last 14 days"
            chart={<BarChart data={revenueTrend} unit="currency" />}
            table={
              <TableShell>
                <thead>
                  <tr>
                    <TableHeadCell>Date</TableHeadCell>
                    <TableHeadCell>Revenue</TableHeadCell>
                  </tr>
                </thead>
                <tbody>
                  {revenueTrend.map((d) => (
                    <tr key={d.date}>
                      <TableCell>{d.date}</TableCell>
                      <TableCell>{formatCurrency(d.value)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            }
          />
        </div>

        <ChartCard
          title="Orders by status"
          subtitle={`${totalOrders} orders total`}
          chart={<StackedBarChart data={statusBreakdown} />}
          table={
            <TableShell>
              <thead>
                <tr>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Orders</TableHeadCell>
                  <TableHeadCell>Share</TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {statusBreakdown.map((d) => (
                  <tr key={d.status}>
                    <TableCell>{orderStatusMeta[d.status].label}</TableCell>
                    <TableCell>{d.count}</TableCell>
                    <TableCell>{((d.count / totalOrders) * 100).toFixed(1)}%</TableCell>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          }
        />
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
