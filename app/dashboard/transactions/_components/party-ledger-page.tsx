import Link from "next/link";

import { PageHeader } from "../../_components/page-header";
import { ExportAction } from "../../_components/export-action";
import { NoPermissionState, EmptyState } from "../../_components/empty-state";
import { StatTile } from "../../_components/stat-tile";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { LedgerTable } from "./ledger-table";
import { listBalances, listLedger, getFinanceSummary } from "@/lib/services/finance.service";
import { toWalletTransactionRow } from "@/lib/mappers/wallet.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readEnumParam } from "@/lib/api/query";
import { WALLET_TRANSACTION_TYPES } from "@/lib/types/enums";
import { formatCurrency } from "../../_lib/format";
import { WalletIcon } from "../../_lib/icons";

/**
 * One side's money: what they are owed, and every movement that got them there.
 *
 * Riders and vendors share this because a wallet is a wallet — the ledger, the
 * balances and the arithmetic are identical, and two copies would drift the
 * first time one of them was fixed.
 */
export async function PartyLedgerPage({
  ownerType,
  title,
  description,
  detailBase,
  searchParams,
}: {
  ownerType: "rider" | "vendor";
  title: string;
  description: string;
  /** Where a name links to: /dashboard/riders or /dashboard/vendors. */
  detailBase: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const permissions = await getPermissions();

  if (!can(permissions, "payments.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={title} description={description} />
        <NoPermissionState what={title.toLowerCase()} />
      </div>
    );
  }

  const params = await searchParams;
  const list = parseListParams(params, 25);

  const [ledger, balances, summary] = await Promise.all([
    listLedger({
      page: list.page,
      per_page: list.per_page,
      search: list.search,
      owner_type: ownerType,
      type: readEnumParam(params, "type", WALLET_TRANSACTION_TYPES),
    }),
    // Page one only: this is the "who is waiting to be paid" panel, not a
    // directory. The full list lives on the vendors/riders screens.
    listBalances(ownerType, { per_page: 8 }),
    getFinanceSummary(),
  ]);

  const owed = ownerType === "rider" ? summary?.owed.riders : summary?.owed.vendors;
  const earned = ownerType === "rider" ? summary?.rider_earnings : summary?.vendor_earnings;

  const rows = balances.items;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        action={
          <ExportAction
            resource="transactions"
            filters={{
              search: list.search,
              owner_type: ownerType,
              type: readEnumParam(params, "type", WALLET_TRANSACTION_TYPES),
            }}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Currently owed"
          value={formatCurrency(owed ?? 0)}
          hint="Earned, not yet withdrawn"
          icon={<WalletIcon />}
        />
        <StatTile
          label="Earned on delivered orders"
          value={formatCurrency(earned ?? 0)}
          icon={<WalletIcon />}
        />
        <StatTile
          label="Wallets with a balance"
          value={balances.pagination.total.toLocaleString()}
          icon={<WalletIcon />}
        />
      </div>

      {rows.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">
              Owed the most
            </h2>
            <Link
              href="/dashboard/transactions/payout-requests"
              className="text-sm font-medium text-brand hover:underline"
            >
              Payout queue →
            </Link>
          </div>

          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>{ownerType === "rider" ? "Rider" : "Vendor"}</TableHeadCell>
                <TableHeadCell>Balance</TableHeadCell>
                <TableHeadCell>Earned</TableHeadCell>
                <TableHeadCell>Withdrawn</TableHeadCell>
                <TableHeadCell>Payable</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {rows.map((wallet) => (
                <tr key={wallet.id} className="transition duration-150 hover:bg-surface-muted">
                  <TableCell className="font-medium">
                    <Link
                      href={`${detailBase}/${wallet.owner_id}`}
                      className="hover:text-brand"
                    >
                      {wallet.owner_name ?? `#${wallet.owner_id}`}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular-nums font-medium text-foreground">
                    {formatCurrency(wallet.balance)}
                  </TableCell>
                  <TableCell className="tabular-nums text-text-secondary">
                    {formatCurrency(wallet.lifetime_earned)}
                  </TableCell>
                  <TableCell className="tabular-nums text-text-secondary">
                    {formatCurrency(wallet.lifetime_withdrawn)}
                  </TableCell>
                  <TableCell>
                    {/* A balance nobody can be paid is the thing a payout run
                        trips over, so it is named here rather than discovered
                        at the point of transfer. */}
                    {wallet.has_payout_details ? (
                      <span className="text-sm text-status-good">Details on file</span>
                    ) : (
                      <span className="text-sm text-status-warning">No payout details</span>
                    )}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">
          Statement
        </h2>

        {ledger.pagination.total === 0 && !list.search ? (
          <EmptyState
            title="Nothing has moved yet"
            description={`Entries appear here once ${ownerType === "rider" ? "riders complete deliveries" : "vendors have orders delivered"}.`}
          />
        ) : (
          <LedgerTable
            transactions={ledger.items.map(toWalletTransactionRow)}
            pagination={ledger.pagination}
            showOwner
          />
        )}
      </section>
    </div>
  );
}
