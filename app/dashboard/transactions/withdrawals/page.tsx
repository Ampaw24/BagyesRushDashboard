import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getTransactions } from "../../_services/mock-data";
import { TransactionsTable } from "../transactions-table";

export const metadata: Metadata = {
  title: "Withdrawals — Bagyes Rush Delivery",
};

export default async function WithdrawalsPage() {
  const transactions = await getTransactions();
  const withdrawals = transactions.filter((t) => t.type === "withdrawal" && t.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Withdrawals" description="Completed and failed withdrawal history." />
      <TransactionsTable transactions={withdrawals} showType={false} />
    </div>
  );
}
