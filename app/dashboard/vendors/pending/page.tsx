import type { Metadata } from "next";
import { VendorsListPage } from "../_components/vendors-list-page";

export const metadata: Metadata = {
  title: "Pending Vendors — Bagyes Rush Delivery",
};

export default async function PendingVendorsPage(props: PageProps<"/dashboard/vendors/pending">) {
  return (
    <VendorsListPage
      title="Pending vendors"
      description="Businesses that have submitted their profile and are waiting on a decision."
      fixedStatus="pending_review"
      searchParams={props.searchParams}
    />
  );
}
