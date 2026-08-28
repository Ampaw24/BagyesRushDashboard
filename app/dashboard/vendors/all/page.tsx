import type { Metadata } from "next";
import { VendorsListPage } from "../_components/vendors-list-page";

export const metadata: Metadata = {
  title: "All Vendors — BagyesRUSH",
};

export default async function AllVendorsPage(props: PageProps<"/dashboard/vendors/all">) {
  return (
    <VendorsListPage
      title="All vendors"
      description="Every business on the marketplace, in any state."
      searchParams={props.searchParams}
    />
  );
}
