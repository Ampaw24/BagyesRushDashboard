import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getTransactions } from "../../_services/mock-data";
import { TransactionsTable } from "../transactions-table";

export const metadata: Metadata = {
  title: "Earnings — Bagyes Rush Delivery",
};

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
