import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getTransactions } from "../../_services/mock-data";
import { TransactionsTable } from "../transactions-table";

export const metadata: Metadata = {
  title: "Earnings — Bagyes Rush Delivery",
};

/**
 * Still on mock data: the API has no earnings ledger. `/admin/payments` records
 * what customers paid, not what the platform or a vendor earned, so there is
 * nothing to map this onto yet. See /dashboard/transactions for the real one.
 */
export default async function EarningsPage() {
  const transactions = await getTransactions();
  const earnings = transactions.filter((t) => t.type === "earning");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Earnings" description="Delivery fees and commission earned by the platform." />
      <TransactionsTable transactions={earnings} showType={false} />
    </div>
  );
}
