import type { Metadata } from "next";
import { WithdrawalsListPage } from "../_components/withdrawals-list-page";

export const metadata: Metadata = {
  title: "Payouts — BagyesRUSH",
};

export default async function PayoutsPage(props: PageProps<"/dashboard/transactions/payouts">) {
  return (
    <WithdrawalsListPage
      title="Payouts"
      description="Every payout to a rider or a vendor, in any state. Filter by side to see one of them."
      showStats
      searchParams={props.searchParams}
    />
  );
}
