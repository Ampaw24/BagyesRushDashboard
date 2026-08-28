import type { Metadata } from "next";

import { PartyLedgerPage } from "../_components/party-ledger-page";

export const metadata: Metadata = {
  title: "Vendor Transactions — BagyesRUSH",
};

export default async function Page(props: PageProps<"/dashboard/transactions/vendors">) {
  return (
    <PartyLedgerPage
      ownerType="vendor"
      title="Vendor transactions"
      description="Every order earning, adjustment and payout on the vendor side."
      detailBase="/dashboard/vendors"
      searchParams={props.searchParams}
    />
  );
}
