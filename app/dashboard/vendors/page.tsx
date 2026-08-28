import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "../_components/page-header";
import { StatTile } from "../_components/stat-tile";
import { DistributionBar, type DistributionSegment } from "../_components/distribution-bar";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { Badge } from "../_components/status-badge";
import { EmptyState, NoPermissionState } from "../_components/empty-state";
import { vendorStateMeta } from "../_lib/status";
import { CheckCircleIcon, ChevronRightIcon, ClockIcon, DangerIcon, ShopIcon } from "../_lib/icons";
import { formatCompactNumber, formatDate } from "../_lib/format";
import { getDashboard } from "@/lib/services/dashboard.service";
import { listVendors } from "@/lib/services/vendors.service";
import { toVendorRow } from "@/lib/mappers/vendor.mapper";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Vendors — BagyesRUSH",
};

/**
 * Vendor counters come from the dashboard endpoint's `vendors` block, which is
 * available to every role that can see the dashboard. The registrations-over-
 * time chart is gone: the API exposes no per-period vendor series.
 */
export default async function VendorsOverviewPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "vendors.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Vendors" description="Manage the businesses operating on BagyesRUSH." />
        <NoPermissionState what="vendors" />
      </div>
    );
  }

  const [dashboard, recentPage] = await Promise.all([
    getDashboard(),
    listVendors({ per_page: 6 }),
  ]);

  const stats = dashboard.vendors;
  const recent = recentPage.items.map(toVendorRow);

  const segments: DistributionSegment[] = [
    { key: "approved", label: "Approved", value: stats.approved, colorClassName: "bg-status-good" },
    { key: "pending_review", label: "Pending review", value: stats.pending_review, colorClassName: "bg-status-warning" },
    { key: "suspended", label: "Suspended", value: stats.suspended, colorClassName: "bg-status-critical" },
    { key: "rejected", label: "Rejected", value: stats.rejected, colorClassName: "bg-status-critical/70" },
  ].filter((segment) => segment.value > 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Vendors"
        description="Manage the businesses operating on BagyesRUSH."
        action={
          can(permissions, "vendors.create") ? (
            <Link
              href="/dashboard/vendors/new"
              className="flex h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
            >
              Add vendor
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total vendors" value={formatCompactNumber(stats.total)} icon={<ShopIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Approved" value={formatCompactNumber(stats.approved)} icon={<CheckCircleIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Pending review" value={formatCompactNumber(stats.pending_review)} icon={<ClockIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Suspended" value={formatCompactNumber(stats.suspended)} icon={<DangerIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Rejected" value={formatCompactNumber(stats.rejected)} icon={<DangerIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Open right now" value={formatCompactNumber(stats.open_now)} icon={<ShopIcon className="h-4.5 w-4.5" />} />
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">Vendors by status</h2>
        <div className="rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          {segments.length > 0 ? (
            <DistributionBar segments={segments} ariaLabel="Vendors by status" />
          ) : (
            <p className="text-sm text-text-muted">No vendors yet.</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
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

        {recent.length === 0 ? (
          <EmptyState title="No vendors yet" description="Approved businesses will appear here." />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>City</TableHeadCell>
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
                  <TableCell className="text-text-secondary">{vendor.businessType ?? "—"}</TableCell>
                  <TableCell className="text-text-secondary">{vendor.city}</TableCell>
                  <TableCell>
                    <Badge meta={vendorStateMeta[vendor.derivedState]} />
                  </TableCell>
                  <TableCell className="text-text-secondary">{formatDate(vendor.joinedAt)}</TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </section>
    </div>
  );
}
