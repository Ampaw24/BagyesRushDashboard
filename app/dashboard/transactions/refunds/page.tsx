import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState, EmptyState } from "../../_components/empty-state";
import { StatTile } from "../../_components/stat-tile";
import { Pagination } from "../../_components/pagination";
import { FilterBar } from "../../_components/filter-bar";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { OrderStatusBadge } from "../../_components/status-badge";
import { DateRangeFilter } from "../_components/date-range-filter";
import { getFinanceSummary, listRefunds } from "@/lib/services/finance.service";
import { toOrderRow } from "@/lib/mappers/order.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readParam } from "@/lib/api/query";
import { formatCurrency, formatDateTime } from "../../_lib/format";
import { WalletIcon, BagIcon } from "../../_lib/icons";

export const metadata: Metadata = {
  title: "Refunds — BagyesRUSH",
};

/**
 * Money taken for orders that will not be delivered.
 *
 * Nothing refunds automatically — the gateway is the only thing that can move
 * money back, and no automated path calls it. So this is a work queue, not an
 * archive: every row is somebody owed their money who has not had it yet.
 */
export default async function RefundsPage(props: PageProps<"/dashboard/transactions/refunds">) {
  const permissions = await getPermissions();

  if (!can(permissions, "payments.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Refunds" description="Orders paid for, then cancelled." />
        <NoPermissionState what="refunds" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params, 25);
  const from = readParam(params, "from");
  const to = readParam(params, "to");

  const [page, summary] = await Promise.all([
    listRefunds({ page: list.page, per_page: list.per_page, search: list.search, from, to }),
    getFinanceSummary(),
  ]);

  const rows = page.items.map(toOrderRow);
  const owed = summary?.refunds_owed;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Refunds"
        description="Orders that took payment and ended cancelled or rejected."
      />

      {/* Named as outstanding rather than "refunded": nothing here has been
          paid back until somebody does it at the gateway. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile
          label="Outstanding refunds"
          value={formatCurrency(owed?.amount ?? 0)}
          hint="Across all time, not just this period"
          icon={<WalletIcon />}
        />
        <StatTile
          label="Orders awaiting a refund"
          value={(owed?.count ?? 0).toLocaleString()}
          icon={<BagIcon />}
        />
      </div>

      <div className="flex flex-col gap-4">
        <DateRangeFilter />
        <FilterBar searchPlaceholder="Search order number or customer" />

        {rows.length === 0 ? (
          <EmptyState
            title="Nothing to refund"
            description="Orders appear here when a paid order is cancelled or rejected."
          />
        ) : (
          <>
            <TableShell>
              <thead>
                <tr>
                  <TableHeadCell>Order</TableHeadCell>
                  <TableHeadCell>Customer</TableHeadCell>
                  <TableHeadCell>Vendor</TableHeadCell>
                  <TableHeadCell>Amount</TableHeadCell>
                  <TableHeadCell>Ended</TableHeadCell>
                  <TableHeadCell>Placed</TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="transition duration-150 hover:bg-surface-muted">
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/orders/${row.id}`} className="hover:text-brand">
                        {row.orderNumber}
                      </Link>
                      {row.isParcel && (
                        <span className="ml-2 text-xs font-normal text-text-muted">
                          {row.typeLabel}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-text-secondary">{row.customerName}</TableCell>

                    <TableCell className="text-text-secondary">
                      {row.vendorName ?? (row.isParcel ? "No vendor" : "—")}
                    </TableCell>

                    <TableCell className="tabular-nums font-medium text-foreground">
                      {formatCurrency(row.total)}
                    </TableCell>

                    <TableCell>
                      <OrderStatusBadge status={row.status} />
                    </TableCell>

                    <TableCell className="text-text-secondary">
                      {formatDateTime(row.placedAt)}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </TableShell>

            <Pagination pagination={page.pagination} />
          </>
        )}
      </div>
    </div>
  );
}
