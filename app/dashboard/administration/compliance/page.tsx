import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState, EmptyState } from "../../_components/empty-state";
import { StatTile } from "../../_components/stat-tile";
import { Pagination } from "../../_components/pagination";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { ComplianceTable } from "./compliance-table";
import { DangerIcon, ProfileTickIcon, RefreshIcon, ShieldIcon } from "../../_lib/icons";
import { getComplianceSummary, listComplianceLogs } from "@/lib/services/compliance.service";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam, readParam } from "@/lib/api/query";

export const metadata: Metadata = {
  title: "Delivery Compliance — BagyesRUSH",
};

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "All statuses",
  options: [
    { value: "pending", label: "Not yet filed" },
    { value: "submitted", label: "Filed, awaiting verification" },
    { value: "verified", label: "Verified" },
    { value: "partially_verified", label: "Partly verified" },
    { value: "unverified", label: "Could not be verified" },
    { value: "failed", label: "Filing failed" },
  ],
};

const ATTENTION_FILTER: SelectFilter = {
  key: "needs_attention",
  label: "Show",
  allLabel: "Everything",
  options: [{ value: "1", label: "Needs attention only" }],
};

/**
 * What has been filed with the Postal and Courier Services Regulatory Commission.
 *
 * This screen exists because the failures are invisible everywhere else. Act 649
 * and L.I. 2205 make logging every delivery our obligation, and nothing a customer
 * sees breaks when a filing is missed — the parcel is collected, delivered and paid
 * for exactly as normal. Without somewhere to look, the first anybody would hear of
 * a gap in the national register is the Commission asking about it.
 *
 * "Needs attention" is the filter somebody actually arrives with: failed, could
 * not be verified, and partly verified are three different problems that all mean
 * "a human has to do something", and no single status says that.
 */
export default async function CompliancePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const permissions = await getPermissions();

  if (!can(permissions, "orders.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Delivery compliance"
          description="Deliveries filed with the Postal and Courier Services Regulatory Commission."
        />
        <NoPermissionState what="delivery compliance filings" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const [page, summary] = await Promise.all([
    listComplianceLogs({
      page: list.page,
      per_page: list.per_page,
      search: list.search,
      status: readParam(params, "status"),
      needs_attention: readBooleanParam(params, "needs_attention"),
    }),
    getComplianceSummary(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Delivery compliance"
        description="Every parcel delivery as filed with iCOLMS Ghana, and what the NIA said about the two people on it. Verification is reported, not enforced — a delivery is never held up waiting for it."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Filed in total" value={summary.total.toLocaleString()} icon={<ShieldIcon />} />
        <StatTile
          label="Awaiting verification"
          value={summary.awaiting_verification.toLocaleString()}
          icon={<RefreshIcon />}
          hint="Normal. The NIA check runs in the background at their end."
        />
        <StatTile label="Verified" value={summary.verified.toLocaleString()} icon={<ProfileTickIcon />} />
        <StatTile
          label="Needs attention"
          value={summary.needs_attention.toLocaleString()}
          icon={<DangerIcon />}
          hint="Filing failed, or one of the two people could not be verified."
        />
      </div>

      {/* Its own line rather than a fifth tile, because it does not mean what the
          others mean: a filing that never left is not a regulator problem, it is
          ours, and it almost always means the queue worker has stopped. */}
      {summary.not_yet_filed > 0 && (
        <div className="rounded-xl border border-status-critical/30 bg-surface p-4">
          <p className="text-sm font-medium text-status-critical">
            {summary.not_yet_filed} deliver{summary.not_yet_filed === 1 ? "y has" : "ies have"} never
            been sent to the Commission.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            Filings are queued, so this usually means the queue worker has stopped rather than that
            iCOLMS refused anything. Check that <code>php artisan queue:work</code> is running.
          </p>
        </div>
      )}

      <FilterBar
        searchPlaceholder="Search reference, name or phone"
        filters={[STATUS_FILTER, ATTENTION_FILTER]}
      />

      {page.items.length === 0 ? (
        <EmptyState
          title="Nothing filed yet"
          description="Parcel deliveries are filed with the Commission once the order is paid for. If parcels are being placed and nothing appears here, check that delivery logging is switched on."
        />
      ) : (
        <>
          <ComplianceTable logs={page.items} canRetry={can(permissions, "settings.manage")} />
          <Pagination pagination={page.pagination} />
        </>
      )}
    </div>
  );
}
