import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "../../_components/page-header";
import { ExportAction } from "../../_components/export-action";
import { NoPermissionState, EmptyState } from "../../_components/empty-state";
import { StatTile } from "../../_components/stat-tile";
import { Pagination } from "../../_components/pagination";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { DateRangeFilter } from "../_components/date-range-filter";
import { getFinanceSummary, listCommissions } from "@/lib/services/finance.service";
import { toOrderRow } from "@/lib/mappers/order.mapper";
import { toDate } from "@/lib/mappers/dates";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readParam } from "@/lib/api/query";
import { formatCurrency, formatDateTimeOrDash } from "../../_lib/format";
import { WalletIcon, BagIcon } from "../../_lib/icons";

export const metadata: Metadata = {
  title: "Commissions Earned — BagyesRUSH",
};

/**
 * What the platform kept, order by order.
 *
 * Read from `orders.commission_minor` — the figure recorded when the order was
 * priced — rather than recomputed from today's percentage. A commission report
 * that recalculated itself would restate every past month the moment somebody
 * edited a rate, which is the one thing a finance record must never do.
 */
export default async function CommissionsPage(
  props: PageProps<"/dashboard/transactions/commissions">,
) {
  const permissions = await getPermissions();

  if (!can(permissions, "payments.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Commissions earned" description="What the platform kept." />
        <NoPermissionState what="commissions" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params, 25);
  const from = readParam(params, "from");
  const to = readParam(params, "to");

  const [page, summary] = await Promise.all([
    listCommissions({ page: list.page, per_page: list.per_page, from, to }),
    getFinanceSummary({ from, to }),
  ]);

  const orders = page.items.map((dto) => ({ row: toOrderRow(dto), dto }));

  /* Averaged over the page's own orders, not the period — the period total is
     already on its own tile, and mixing the two scopes in one row of stats is
     how a dashboard starts lying quietly. */
  const perOrder = summary && summary.orders > 0 ? summary.commission_earned / summary.orders : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Commissions earned"
        description="The platform's share of every delivered order, as it was recorded."
        action={<ExportAction resource="commissions" filters={{ from, to }} />}
      />

      <DateRangeFilter />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Commission earned"
          value={formatCurrency(summary?.commission_earned ?? 0)}
          icon={<WalletIcon />}
        />
        <StatTile
          label="Delivered orders"
          value={(summary?.orders ?? 0).toLocaleString()}
          icon={<BagIcon />}
        />
        <StatTile
          label="Average per order"
          value={formatCurrency(perOrder)}
          icon={<WalletIcon />}
        />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No commission in this period"
          description="Commission is recorded when an order is delivered."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Order</TableHeadCell>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell>Customer paid</TableHeadCell>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell>Rider</TableHeadCell>
                <TableHeadCell>Platform kept</TableHeadCell>
                <TableHeadCell>Delivered</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {orders.map(({ row, dto }) => (
                <tr key={row.id} className="transition duration-150 hover:bg-surface-muted">
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/orders/${row.id}`} className="hover:text-brand">
                      {row.orderNumber}
                    </Link>
                    {/* Only parcels are labelled: food is the default and
                        tagging every row would be noise. */}
                    {row.isParcel && (
                      <span className="ml-2 text-xs font-normal text-text-muted">
                        {row.typeLabel}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-text-secondary">{row.vendorName ?? "—"}</TableCell>

                  <TableCell className="tabular-nums text-text-secondary">
                    {formatCurrency(row.total)}
                  </TableCell>

                  {/* Checked per field, not per object. Each side settles at
                      its own moment, so an order can legitimately know the
                      vendor's share and not the rider's — a dash rather than a
                      confident zero for whichever is still outstanding. */}
                  <TableCell className="tabular-nums text-text-secondary">
                    {row.earnings?.vendor != null ? formatCurrency(row.earnings.vendor) : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums text-text-secondary">
                    {row.earnings?.rider != null ? formatCurrency(row.earnings.rider) : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums font-medium text-foreground">
                    {row.earnings?.platform != null ? formatCurrency(row.earnings.platform) : "—"}
                  </TableCell>

                  <TableCell className="text-text-secondary">
                    {formatDateTimeOrDash(
                      toDate(
                        dto.timeline.find((step) => step.status === "delivered")?.at ??
                          dto.created_at,
                      ),
                    )}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={page.pagination} />
        </div>
      )}
    </div>
  );
}
