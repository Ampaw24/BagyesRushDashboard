import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getTransactions } from "../../_services/mock-data";
import { TransactionsTable } from "../transactions-table";

export const metadata: Metadata = {
  title: "Deposits — Bagyes Rush Delivery",
};

/**
 * Still on mock data: the API has no deposits ledger. See
 * /dashboard/transactions for the real payments list.
 */
export default async function DepositsPage() {
  const transactions = await getTransactions();
  const deposits = transactions.filter((t) => t.type === "deposit");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Deposits" description="Funds added to rider and customer wallets." />
      <TransactionsTable transactions={deposits} showType={false} />
    </div>
  );
}
