import type { Metadata } from "next";
import { PageHeader } from "../_components/page-header";
import { getTransactions } from "../_services/mock-data";
import { TransactionsTable } from "./transactions-table";

export const metadata: Metadata = {
  title: "Transactions — Bagyes Rush Delivery",
};

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Transactions" description="Every earning, deposit, and withdrawal moving through the platform." />
      <TransactionsTable transactions={transactions} />
    </div>
  );
}
