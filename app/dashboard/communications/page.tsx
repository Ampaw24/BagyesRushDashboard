import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "../_components/page-header";
import { StatTile } from "../_components/stat-tile";
import { ChartCard } from "../_components/chart-card";
import { LineChart } from "../_components/line-chart";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { Badge } from "../_components/status-badge";
import { DistributionBar } from "../_components/distribution-bar";
import { communicationStatusMeta, communicationTypeMeta, channelMeta } from "../_lib/communications";
import {
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  MegaphoneIcon,
  UsersIcon,
  AnalyticsIcon,
  XCircleIcon,
} from "../_lib/icons";
import { formatCompactNumber, formatDateTime } from "../_lib/format";
import {
  getChannelUsageBreakdown,
  getCommunicationsOverTime,
  getCommunicationsOverviewStats,
  getRecentCommunications,
} from "../_services/communications-mock-data";

export const metadata: Metadata = {
  title: "Communications — Bagyes Rush Delivery",
};

export default async function CommunicationsOverviewPage() {
  const [stats, overTime, channelUsage, recent] = await Promise.all([
    getCommunicationsOverviewStats(),
    getCommunicationsOverTime(),
    getChannelUsageBreakdown(),
    getRecentCommunications(6),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Communications"
        description="Reach riders and customers with notifications, announcements, and updates."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/communications/templates"
              className="flex h-11 items-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
            >
              Templates
            </Link>
            <Link
              href="/dashboard/communications/new"
              className="flex h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
            >
              Create communication
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total communications" value={formatCompactNumber(stats.totalCommunications)} icon={<MegaphoneIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Sent today" value={formatCompactNumber(stats.sentToday)} icon={<CheckCircleIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Scheduled" value={formatCompactNumber(stats.scheduled)} icon={<ClockIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Failed" value={formatCompactNumber(stats.failed)} icon={<XCircleIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Total recipients" value={formatCompactNumber(stats.totalRecipients)} icon={<UsersIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Engagement rate" value={`${stats.engagementRatePercent}%`} icon={<AnalyticsIcon className="h-4.5 w-4.5" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Communications over time"
          subtitle="Last 14 days"
          chart={<LineChart data={overTime} unit="count" unitLabel="communications" />}
          table={
            <TableShell>
              <thead>
                <tr>
                  <TableHeadCell>Date</TableHeadCell>
                  <TableHeadCell>Communications</TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {overTime.map((d) => (
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
          title="Channel usage"
          subtitle={`${channelUsage.reduce((sum, c) => sum + c.count, 0)} channel selections total`}
          chart={
            <DistributionBar
              ariaLabel="Channel usage"
              segments={channelUsage.map((c) => ({
                key: c.channel,
                label: channelMeta[c.channel].label,
                value: c.count,
                colorClassName: channelMeta[c.channel].colorClassName,
              }))}
            />
          }
          table={
            <TableShell>
              <thead>
                <tr>
                  <TableHeadCell>Channel</TableHeadCell>
                  <TableHeadCell>Communications</TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {channelUsage.map((c) => (
                  <tr key={c.channel}>
                    <TableCell>{channelMeta[c.channel].label}</TableCell>
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
          <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">Recent communications</h2>
          <Link
            href="/dashboard/communications/history"
            className="flex min-h-11 items-center gap-1 text-sm font-medium text-brand transition duration-150 hover:opacity-80"
          >
            View all
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Communication</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Channels</TableHeadCell>
              <TableHeadCell>Recipients</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Date</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {recent.map((c) => (
              <tr key={c.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/communications/history/${c.id}`} className="hover:text-brand">
                    {c.title}
                  </Link>
                </TableCell>
                <TableCell className="text-text-secondary">{communicationTypeMeta[c.type].label}</TableCell>
                <TableCell className="text-text-secondary">{c.channels.map((ch) => channelMeta[ch].label).join(" + ")}</TableCell>
                <TableCell className="text-text-secondary">{c.audience.resolvedCount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge meta={communicationStatusMeta[c.status]} />
                </TableCell>
                <TableCell className="text-text-secondary">{formatDateTime(c.updatedAt)}</TableCell>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}
