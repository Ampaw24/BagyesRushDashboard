import type { Metadata } from "next";
import { WithdrawalsListPage } from "../_components/withdrawals-list-page";

export const metadata: Metadata = {
  title: "Payout Requests — BagyesRUSH",
};

export default async function PayoutRequestsPage(
  props: PageProps<"/dashboard/transactions/payout-requests">,
) {
  return (
    <WithdrawalsListPage
      title="Payout requests"
      description="Riders and vendors waiting to be paid. Approving clears a payout for payment; marking it paid records that you actually sent it."
      fixedStatus="pending"
      showStats
      searchParams={props.searchParams}
    />
  );
}
