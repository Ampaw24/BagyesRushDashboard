"use client";

import Link from "next/link";

import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { EmptyState } from "../../_components/empty-state";
import { Pagination } from "../../_components/pagination";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { formatCurrency, formatDateTime } from "../../_lib/format";
import type { WalletTransactionRow } from "@/lib/mappers/wallet.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import { WALLET_TRANSACTION_TYPES, walletTransactionTypeLabels } from "@/lib/types/enums";

/**
 * Which side a line belongs to. Offered only where both are listed — on a
 * vendor's own statement it would be a control with one useful setting.
 */
const OWNER_FILTER: SelectFilter = {
  key: "owner_type",
  label: "Side",
  allLabel: "Riders and vendors",
  options: [
    { value: "rider", label: "Riders" },
    { value: "vendor", label: "Vendors" },
  ],
};

const TYPE_FILTER: SelectFilter = {
  key: "type",
  label: "Type",
  allLabel: "All movements",
  options: WALLET_TRANSACTION_TYPES.map((type) => ({
    value: type,
    label: walletTransactionTypeLabels[type],
  })),
};

/**
 * A statement: every movement in or out of a wallet.
 *
 * The same table for riders and vendors, because a ledger line is a ledger line
 * — what differs is only who it belongs to, and that column is dropped on the
 * screens where it is already the answer.
 */
export function LedgerTable({
  transactions,
  pagination,
  /** Hidden on the per-party screens, where every row has the same owner. */
  showOwner = true,
  showOwnerFilter = false,
  emptyDescription = "Nothing has moved yet.",
}: {
  transactions: WalletTransactionRow[];
  pagination: PaginationMeta;
  showOwner?: boolean;
  /** Only on the combined view; the per-side screens have already chosen. */
  showOwnerFilter?: boolean;
  emptyDescription?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchPlaceholder="Search reference or note"
        filters={showOwnerFilter ? [OWNER_FILTER, TYPE_FILTER] : [TYPE_FILTER]}
      />

      {transactions.length === 0 ? (
        <EmptyState title="No transactions" description={emptyDescription} />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Reference</TableHeadCell>
              {showOwner && <TableHeadCell>Party</TableHeadCell>}
              <TableHeadCell>Movement</TableHeadCell>
              <TableHeadCell>Order</TableHeadCell>
              <TableHeadCell>Amount</TableHeadCell>
              <TableHeadCell>Balance after</TableHeadCell>
              <TableHeadCell>When</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {transactions.map((row) => (
              <tr key={row.id} className="transition duration-150 hover:bg-surface-muted">
                <TableCell>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">{row.reference}</span>
                    {row.note && (
                      <span className="line-clamp-1 text-xs text-text-muted">{row.note}</span>
                    )}
                  </span>
                </TableCell>

                {showOwner && (
                  <TableCell className="text-text-secondary">
                    {row.ownerId && row.ownerType ? (
                      <Link
                        href={`/dashboard/${row.ownerType === "vendor" ? "vendors" : "riders"}/${row.ownerId}`}
                        className="hover:text-brand"
                      >
                        {row.ownerName ?? "—"}
                      </Link>
                    ) : (
                      (row.ownerName ?? "—")
                    )}
                    {row.ownerType && (
                      <span className="mt-0.5 block text-xs capitalize text-text-muted">
                        {row.ownerType}
                      </span>
                    )}
                  </TableCell>
                )}

                <TableCell className="text-text-secondary">{row.typeLabel}</TableCell>

                <TableCell className="text-text-secondary">
                  {row.orderId && row.orderNumber ? (
                    <Link href={`/dashboard/orders/${row.orderId}`} className="hover:text-brand">
                      {row.orderNumber}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>

                <TableCell>
                  {/* Signed, because that is how a statement reads: money out
                      should look different from money in at a glance. */}
                  <span
                    className={`tabular-nums font-medium ${row.isCredit ? "text-status-good" : "text-status-critical"}`}
                  >
                    {row.isCredit ? "+" : ""}
                    {formatCurrency(row.amount)}
                  </span>
                </TableCell>

                <TableCell className="tabular-nums text-text-secondary">
                  {formatCurrency(row.balanceAfter)}
                </TableCell>

                <TableCell className="text-text-secondary">
                  {formatDateTime(row.createdAt)}
                </TableCell>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Pagination pagination={pagination} />
    </div>
  );
}
