import type { Metadata } from "next";

import { PageHeader } from "../_components/page-header";
import { NoPermissionState } from "../_components/empty-state";
import { StatTile } from "../_components/stat-tile";
import { ReportsTable } from "./_components/reports-table";
import { getReportStats, listReports } from "@/lib/services/reports.service";
import { toReportRow } from "@/lib/mappers/report.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readEnumParam } from "@/lib/api/query";
import { REPORT_STATUSES, REPORT_TARGET_TYPES } from "@/lib/types/enums";
import { CheckCircleIcon, ClockIcon, DangerIcon, SupportIcon } from "../_lib/icons";

export const metadata: Metadata = {
  title: "Support — BagyesRUSH",
};

/**
 * Complaints from all three apps.
 *
 * Open ones come back first — this is a work queue before it is an archive, and
 * a complaint nobody has looked at is the reason the screen exists.
 */
export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const permissions = await getPermissions();

  if (!can(permissions, "reports.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Support" description="Complaints that need a response." />
        <NoPermissionState what="reports" />
      </div>
    );
  }

  const params = await searchParams;
  const list = parseListParams(params);

  const [page, stats] = await Promise.all([
    listReports({
      page: list.page,
      per_page: list.per_page,
      search: list.search,
      status: readEnumParam(params, "status", REPORT_STATUSES),
      target_type: readEnumParam(params, "target_type", REPORT_TARGET_TYPES),
    }),
    getReportStats(),
  ]);

  // Read through a default rather than straight off the response: a tile is
  // decoration, and an older backend missing one of these counts should not
  // take the whole board down with it.
  const count = (value: number | undefined) => (value ?? 0).toLocaleString();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Support"
        description="Complaints filed from the customer, vendor and rider apps."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} report
            {page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Open" value={count(stats.open)} icon={<DangerIcon />} />
        <StatTile
          label="Awaiting a first look"
          value={count(stats.by_status?.pending)}
          icon={<ClockIcon />}
        />
        <StatTile label="Filed today" value={count(stats.today)} icon={<SupportIcon />} />
        <StatTile
          label="Resolved"
          value={count(stats.by_status?.resolved)}
          icon={<CheckCircleIcon />}
        />
      </div>

      <ReportsTable
        reports={page.items.map(toReportRow)}
        pagination={page.pagination}
        canManage={can(permissions, "reports.manage")}
      />
    </div>
  );
}
