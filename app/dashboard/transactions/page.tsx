import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "../_components/page-header";
import { NoPermissionState, EmptyState } from "../_components/empty-state";
import { StatTile } from "../_components/stat-tile";
import { getFinanceSummary } from "@/lib/services/finance.service";
import { getPlatformSettings } from "@/lib/services/platform-settings.service";
import { can, getPermissions } from "@/lib/auth/guard";
import { readParam } from "@/lib/api/query";
import { formatCurrency } from "../_lib/format";
import { WalletIcon, BagIcon, RidersIcon, ShopIcon } from "../_lib/icons";
import { DateRangeFilter } from "./_components/date-range-filter";
import { MoneyFlow } from "./_components/money-flow";

export const metadata: Metadata = {
  title: "Transactions Report — BagyesRUSH",
};

/**
 * The reconciliation: what came in, what went out, what is still owed.
 *
 * Deliberately not a single "profit" number. Money sitting in a rider's or a
 * vendor's wallet is neither the platform's nor spent, so it is reported as its
 * own figure — collapsing the three would make the balance sheet read better
 * than it is.
 *
 * Every figure here is what was recorded when each order was priced. Changing
 * the commission tomorrow does not restate yesterday.
 */
export default async function TransactionsPage(props: PageProps<"/dashboard/transactions">) {
  const permissions = await getPermissions();

  if (!can(permissions, "payments.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Transactions" description="Where the money went." />
        <NoPermissionState what="the finance report" />
      </div>
    );
  }

  const params = await props.searchParams;
  const from = readParam(params, "from");
  const to = readParam(params, "to");

  const [summary, settings] = await Promise.all([
    getFinanceSummary({ from, to }),
    // The rates that priced it all, so the report and the setup screen can
    // never quietly disagree about what the platform charges.
    can(permissions, "settings.manage") ? getPlatformSettings() : Promise.resolve(null),
  ]);

  if (!summary) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Transactions" description="Where the money went." />
        <EmptyState
          title="Finance reporting is not available"
          description="The connected backend does not expose the finance endpoints yet."
        />
      </div>
    );
  }

  const owed = summary.owed.riders + summary.owed.vendors;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transactions report"
        description="Everything the platform collected, paid and kept."
      />

      <DateRangeFilter />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Collected"
          value={formatCurrency(summary.collected)}
          hint={`${summary.orders.toLocaleString()} delivered ${summary.orders === 1 ? "order" : "orders"}`}
          icon={<BagIcon />}
        />
        <StatTile
          label="Platform kept"
          value={formatCurrency(summary.platform_earnings)}
          hint="Commission and service fees"
          icon={<WalletIcon />}
        />
        <StatTile
          label="Paid out"
          value={formatCurrency(summary.payouts.paid)}
          hint={`${formatCurrency(summary.payouts.pending)} awaiting a decision`}
          icon={<CheckIcon />}
        />
        <StatTile
          label="Still owed"
          value={formatCurrency(owed)}
          hint="Earned, not yet withdrawn"
          icon={<RidersIcon />}
        />
      </div>

      {/* The whole point of the screen: how one order's money splits, using
          the rates that are live right now. */}
      <MoneyFlow summary={summary} settings={settings?.current ?? null} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BreakdownCard
          title="Owed to vendors"
          amount={summary.owed.vendors}
          href="/dashboard/transactions/vendors"
          linkLabel="Vendor transactions"
          icon={<ShopIcon />}
        />
        <BreakdownCard
          title="Owed to riders"
          amount={summary.owed.riders}
          href="/dashboard/transactions/riders"
          linkLabel="Rider transactions"
          icon={<RidersIcon />}
        />
        <BreakdownCard
          title="Refunds owed"
          amount={summary.refunds_owed.amount}
          hint={`${summary.refunds_owed.count.toLocaleString()} ${summary.refunds_owed.count === 1 ? "order" : "orders"} paid then cancelled`}
          href="/dashboard/transactions/refunds"
          linkLabel="Review refunds"
          icon={<WalletIcon />}
          /* Nothing refunds automatically, so an outstanding balance here is a
             work queue rather than a statistic. */
          urgent={summary.refunds_owed.count > 0}
        />
      </section>
    </div>
  );
}

function BreakdownCard({
  title,
  amount,
  hint,
  href,
  linkLabel,
  icon,
  urgent = false,
}: {
  title: string;
  amount: number;
  hint?: string;
  href: string;
  linkLabel: string;
  icon: React.ReactNode;
  urgent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border bg-surface p-5 shadow-sm ${
        urgent ? "border-status-warning/40" : "border-border-subtle"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          {icon}
        </span>
        <p className="break-words text-sm text-text-secondary">{title}</p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {formatCurrency(amount)}
        </p>
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>

      <Link href={href} className="text-sm font-medium text-brand hover:underline">
        {linkLabel} →
      </Link>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
