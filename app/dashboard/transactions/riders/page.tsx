import type { Metadata } from "next";

import { PartyLedgerPage } from "../_components/party-ledger-page";

export const metadata: Metadata = {
  title: "Rider Transactions — BagyesRUSH",
};

export default async function Page(props: PageProps<"/dashboard/transactions/riders">) {
  return (
    <PartyLedgerPage
      ownerType="rider"
      title="Rider transactions"
      description="Every delivery earning, adjustment and payout on the rider side."
      detailBase="/dashboard/riders"
      searchParams={props.searchParams}
    />
  );
}
