import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "../_components/page-header";
import { StatTile } from "../_components/stat-tile";
import { ChartCard } from "../_components/chart-card";
import { LineChart } from "../_components/line-chart";
import { DistributionBar } from "../_components/distribution-bar";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { Badge } from "../_components/status-badge";
import { vendorStatusMeta, CATEGORY_COLOR_CLASS } from "../_lib/vendors";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  DangerIcon,
  ShopIcon,
  VerifyIcon,
} from "../_lib/icons";
import { formatCompactNumber, formatDate } from "../_lib/format";
import {
  getVendorCategoryBreakdown,
  getVendorRegistrationsOverTime,
  getVendors,
  getVendorsOverviewStats,
} from "../_services/vendors-mock-data";

export const metadata: Metadata = {
  title: "Vendors — Bagyes Rush Delivery",
};

export default async function VendorsOverviewPage() {
  const [stats, registrations, categories, vendors] = await Promise.all([
    getVendorsOverviewStats(),
    getVendorRegistrationsOverTime(),
    getVendorCategoryBreakdown(),
    getVendors(),
  ]);

  const recent = vendors.slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Vendors"
        description="Manage the food vendors operating on Bagyes Rush."
        action={
          <Link
            href="/dashboard/vendors/new"
            className="flex h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            Add vendor
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total vendors" value={formatCompactNumber(stats.totalVendors)} icon={<ShopIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Active vendors" value={formatCompactNumber(stats.activeVendors)} icon={<CheckCircleIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Pending vendors" value={formatCompactNumber(stats.pendingVendors)} icon={<ClockIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Suspended vendors" value={formatCompactNumber(stats.suspendedVendors)} icon={<DangerIcon className="h-4.5 w-4.5" />} />
        <StatTile label="New this month" value={formatCompactNumber(stats.newVendorsThisMonth)} icon={<ShopIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Verified vendors" value={formatCompactNumber(stats.verifiedVendors)} icon={<VerifyIcon className="h-4.5 w-4.5" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Vendor registrations"
          subtitle="Last several months"
          chart={<LineChart data={registrations} unit="count" unitLabel="vendors" />}
          table={
            <TableShell>
              <thead>
                <tr>
                  <TableHeadCell>Period</TableHeadCell>
                  <TableHeadCell>New vendors</TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {registrations.map((d) => (
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
          title="Vendor categories"
          subtitle={`${categories.reduce((sum, c) => sum + c.count, 0)} vendors total`}
          chart={
            <DistributionBar
              ariaLabel="Vendor categories"
              segments={categories.map((c) => ({ key: c.category, label: c.category, value: c.count, colorClassName: CATEGORY_COLOR_CLASS[c.category] }))}
            />
          }
          table={
            <TableShell>
              <thead>
                <tr>
                  <TableHeadCell>Category</TableHeadCell>
                  <TableHeadCell>Vendors</TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.category}>
                    <TableCell>{c.category}</TableCell>
                    <TableCell>{c.count}</TableCell>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          }
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">Recently joined</h2>
          <Link
            href="/dashboard/vendors/all"
            className="flex min-h-11 items-center gap-1 text-sm font-medium text-brand transition duration-150 hover:opacity-80"
          >
            View all
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Vendor</TableHeadCell>
              <TableHeadCell>Category</TableHeadCell>
              <TableHeadCell>Location</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Joined</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {recent.map((vendor) => (
              <tr key={vendor.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/vendors/${vendor.id}`} className="hover:text-brand">
                    {vendor.businessName}
                  </Link>
                </TableCell>
                <TableCell className="text-text-secondary">{vendor.category}</TableCell>
                <TableCell className="text-text-secondary">{vendor.city}</TableCell>
                <TableCell>
                  <Badge meta={vendorStatusMeta[vendor.status]} />
                </TableCell>
                <TableCell className="text-text-secondary">{formatDate(vendor.joinedAt)}</TableCell>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}
