import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { ExportAction } from "../../_components/export-action";
import { StatTile } from "../../_components/stat-tile";
import { Meter } from "../../_components/meter";
import { NoPermissionState } from "../../_components/empty-state";
import { CheckCircleIcon, WalletIcon } from "../../_lib/icons";
import { formatCompactCurrency, formatCompactNumber } from "../../_lib/format";
import { PaymentsTable } from "./payments-table";
import { getPaymentStats, listPayments } from "@/lib/services/payments.service";
import { toPaymentRow } from "@/lib/mappers/payment.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readEnumParam, readParam } from "@/lib/api/query";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/types/enums";

export const metadata: Metadata = {
  title: "Customer Payments — BagyesRUSH",
};

/**
 * The backend models customer payments, not a vendor wallet — there is no
 * earnings/deposits/withdrawals ledger. This page is therefore the payments
 * ledger; the four sub-pages under Transactions have no endpoint and still
 * run on mock data.
 */
export default async function TransactionsPage(props: PageProps<"/dashboard/transactions/payments">) {
  const permissions = await getPermissions();

  if (!can(permissions, "payments.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Transactions" description="Customer payments collected through the platform." />
        <NoPermissionState what="payments" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params, 25);

  const [page, stats] = await Promise.all([
    listPayments({
      page: list.page,
      per_page: list.per_page,
      search: list.search,
      status: readEnumParam(params, "status", PAYMENT_STATUSES),
      method: readEnumParam(params, "method", PAYMENT_METHODS),
      provider: readParam(params, "provider"),
      from: readParam(params, "from"),
      to: readParam(params, "to"),
    }),
    getPaymentStats(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transactions"
        description="Customer payments collected through the platform."
        action={<ExportAction resource="payments" filters={{ search: list.search }} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Collected all time"
          value={formatCompactCurrency(stats.all_time.collected)}
          icon={<WalletIcon className="h-4.5 w-4.5" />}
        />
        <StatTile
          label="Refunded all time"
          value={formatCompactCurrency(stats.all_time.refunded)}
          icon={<WalletIcon className="h-4.5 w-4.5" />}
        />
        <StatTile
          label="Pending attempts"
          value={formatCompactNumber(stats.pending_attempts)}
          icon={<WalletIcon className="h-4.5 w-4.5" />}
        />
        <Meter
          label="Success rate (all time)"
          value={stats.all_time.success_rate}
          icon={<CheckCircleIcon className="h-4.5 w-4.5" />}
        />
      </div>

      {stats.stale_pending_attempts > 0 && (
        <p className="break-words rounded-xl border border-status-warning/30 bg-status-warning/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          {stats.stale_pending_attempts} payment attempt
          {stats.stale_pending_attempts === 1 ? " has" : "s have"} been pending for a while. Re-checking
          them with the gateway will settle or fail them.
        </p>
      )}

      <PaymentsTable
        payments={page.items.map(toPaymentRow)}
        pagination={page.pagination}
        canVerify={can(permissions, "payments.verify")}
      />
    </div>
  );
}
