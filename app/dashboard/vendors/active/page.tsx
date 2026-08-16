import type { Metadata } from "next";
import { VendorsListPage } from "../_components/vendors-list-page";

export const metadata: Metadata = {
  title: "Active Vendors — Bagyes Rush Delivery",
};

export default async function ActiveVendorsPage(props: PageProps<"/dashboard/vendors/active">) {
  return (
    <VendorsListPage
      title="Active vendors"
      description="Approved businesses that are switched on and taking orders."
      fixedStatus="approved"
      fixedIsActive
      searchParams={props.searchParams}
    />
  );
}
