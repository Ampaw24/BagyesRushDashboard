import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getTransactions } from "../../_services/mock-data";
import { WithdrawalRequestsTable } from "./withdrawal-requests-table";

export const metadata: Metadata = {
  title: "Withdrawal Requests — Bagyes Rush Delivery",
};

export default async function WithdrawalRequestsPage() {
  const transactions = await getTransactions();
  const requests = transactions.filter((t) => t.type === "withdrawal" && t.status === "pending");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Withdrawal requests" description="Payout requests waiting for approval." />
      <WithdrawalRequestsTable requests={requests} />
    </div>
  );
}
