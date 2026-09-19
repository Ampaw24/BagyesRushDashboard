import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { ExportAction } from "../../_components/export-action";
import { NoPermissionState, EmptyState } from "../../_components/empty-state";
import { StatTile } from "../../_components/stat-tile";
import { LedgerTable } from "../_components/ledger-table";
import { DateRangeFilter } from "../_components/date-range-filter";
import { getFinanceSummary, listLedger } from "@/lib/services/finance.service";
import { toWalletTransactionRow } from "@/lib/mappers/wallet.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readEnumParam, readParam } from "@/lib/api/query";
import { WALLET_TRANSACTION_TYPES } from "@/lib/types/enums";
import { formatCurrency } from "../../_lib/format";
import { WalletIcon, RidersIcon, ShopIcon } from "../../_lib/icons";

export const metadata: Metadata = {
  title: "All Transactions — BagyesRUSH",
};

/** Both sides draw from the same ledger. */
const OWNER_TYPES = ["rider", "vendor", "customer"] as const;

/**
 * Every movement on the platform, riders and vendors together.
 *
 * The per-side screens answer "how is this vendor doing"; this one answers
 * "what has moved lately", which is the question you cannot ask if you have to
 * pick a side first. Same ledger underneath — one implementation, filtered.
 */
export default async function AllTransactionsPage(
  props: PageProps<"/dashboard/transactions/all">,
) {
  const permissions = await getPermissions();

  if (!can(permissions, "payments.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="All transactions" description="Every movement on the platform." />
        <NoPermissionState what="transactions" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params, 25);
  const ownerType = readEnumParam(params, "owner_type", OWNER_TYPES);
  const from = readParam(params, "from");
  const to = readParam(params, "to");

  const [ledger, summary] = await Promise.all([
    listLedger({
      page: list.page,
      per_page: list.per_page,
      search: list.search,
      owner_type: ownerType,
      type: readEnumParam(params, "type", WALLET_TRANSACTION_TYPES),
      from,
      to,
    }),
    getFinanceSummary({ from, to }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="All transactions"
        description="Every credit and debit across riders and vendors, newest first."
        action={
          <div className="flex items-center gap-3">
            <ExportAction
              resource="transactions"
              filters={{
                search: list.search,
                owner_type: ownerType,
                type: readEnumParam(params, "type", WALLET_TRANSACTION_TYPES),
                from,
                to,
              }}
            />
            <span className="text-sm text-text-muted">
              {ledger.pagination.total.toLocaleString()} entr
              {ledger.pagination.total === 1 ? "y" : "ies"}
            </span>
          </div>
        }
      />

      {/* Owed, not earned: what is still sitting in wallets is what these
          movements have added up to and nobody has withdrawn. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Owed to vendors"
          value={formatCurrency(summary?.owed.vendors ?? 0)}
          icon={<ShopIcon />}
        />
        <StatTile
          label="Owed to riders"
          value={formatCurrency(summary?.owed.riders ?? 0)}
          icon={<RidersIcon />}
        />
        <StatTile
          label="Paid out"
          value={formatCurrency(summary?.payouts.paid ?? 0)}
          hint={`${formatCurrency(summary?.payouts.pending ?? 0)} awaiting a decision`}
          icon={<WalletIcon />}
        />
      </div>

      <DateRangeFilter />

      {ledger.pagination.total === 0 && !list.search && !ownerType ? (
        <EmptyState
          title="Nothing has moved yet"
          description="Entries appear here once orders are delivered and wallets start being credited."
        />
      ) : (
        <LedgerTable
          transactions={ledger.items.map(toWalletTransactionRow)}
          pagination={ledger.pagination}
          showOwner
          showOwnerFilter
          emptyDescription="No transactions match these filters."
        />
      )}
    </div>
  );
}
