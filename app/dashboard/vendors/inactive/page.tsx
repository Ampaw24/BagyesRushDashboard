import type { Metadata } from "next";
import { VendorsListPage } from "../_components/vendors-list-page";

export const metadata: Metadata = {
  title: "Inactive Vendors — Bagyes Rush Delivery",
};

export default async function InactiveVendorsPage(props: PageProps<"/dashboard/vendors/inactive">) {
  return (
    <VendorsListPage
      title="Inactive vendors"
      description="Approved businesses that have switched themselves off."
      fixedStatus="approved"
      fixedIsActive={false}
      searchParams={props.searchParams}
    />
  );
}
