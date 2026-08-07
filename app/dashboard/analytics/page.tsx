import type { Metadata } from "next";
import { PageHeader } from "../_components/page-header";
import { ChartCard } from "../_components/chart-card";
import { LineChart } from "../_components/line-chart";
import { BarChart } from "../_components/bar-chart";
import { StackedBarChart } from "../_components/stacked-bar-chart";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { orderStatusMeta } from "../_lib/status";
import { formatCurrency } from "../_lib/format";
import { getDeliveryTrend, getOrderStatusBreakdown, getRevenueTrend } from "../_services/mock-data";

export const metadata: Metadata = {
  title: "Analytics — Bagyes Rush Delivery",
};

export default async function AnalyticsPage() {
  const [deliveryTrend, revenueTrend, statusBreakdown] = await Promise.all([
    getDeliveryTrend(),
    getRevenueTrend(),
    getOrderStatusBreakdown(),
  ]);

  const totalOrders = statusBreakdown.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analytics" description="Delivery volume, revenue, and order status over the last 14 days." />

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
  );
}
