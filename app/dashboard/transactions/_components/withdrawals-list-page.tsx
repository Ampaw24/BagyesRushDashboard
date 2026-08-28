import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { StatTile } from "../../_components/stat-tile";
import { WithdrawalsTable } from "../payout-requests/payouts-table";
import { getWithdrawalStats, listWithdrawals } from "@/lib/services/wallets.service";
import { toWithdrawalRow } from "@/lib/mappers/wallet.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readEnumParam } from "@/lib/api/query";
import { WITHDRAWAL_STATUSES, type WithdrawalStatus } from "@/lib/types/enums";

/** Both sides draw from the same queue. */
const OWNER_TYPES = ["rider", "vendor"] as const;
import { formatCurrency } from "../../_lib/format";
import { ClockIcon, WalletIcon } from "../../_lib/icons";

/**
 * Shared body for the payout routes.
 *
 * Two views of the same collection: the queue (awaiting a decision) and the
 * history (everything). Ordered by the API with pending first, then oldest by
 * request date — somebody has been waiting longest for their money.
 */
export async function WithdrawalsListPage({
  title,
  description,
  fixedStatus,
  showStats = false,
  searchParams,
}: {
  title: string;
  description: string;
  fixedStatus?: WithdrawalStatus;
  showStats?: boolean;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const permissions = await getPermissions();

  if (!can(permissions, "withdrawals.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={title} description={description} />
        <NoPermissionState what="payouts" />
      </div>
    );
  }

  const params = await searchParams;
  const list = parseListParams(params);

  const [page, stats] = await Promise.all([
    listWithdrawals({
      page: list.page,
      per_page: list.per_page,
      search: list.search,
      status: fixedStatus ?? readEnumParam(params, "status", WITHDRAWAL_STATUSES),
      owner_type: readEnumParam(params, "owner_type", OWNER_TYPES),
    }),
    showStats ? getWithdrawalStats() : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} request
            {page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Awaiting review"
            value={stats.awaiting_review.toLocaleString()}
            icon={<ClockIcon />}
          />
          <StatTile
            label="Requested"
            value={formatCurrency(stats.by_status.pending.amount)}
            icon={<WalletIcon />}
          />
          {/* Everything currently sitting in rider and vendor wallets — what
              the platform owes right now, whether or not anyone has asked. */}
          <StatTile label="Owed out" value={formatCurrency(stats.owed)} icon={<WalletIcon />} />
          <StatTile
            label="Paid all time"
            value={formatCurrency(stats.paid_all_time)}
            icon={<WalletIcon />}
          />
        </div>
      )}

      <WithdrawalsTable
        withdrawals={page.items.map(toWithdrawalRow)}
        pagination={page.pagination}
        canProcess={can(permissions, "withdrawals.process")}
        showStatusFilter={fixedStatus === undefined}
      />
    </div>
  );
}
