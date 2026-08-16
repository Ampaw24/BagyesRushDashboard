import type { Metadata } from "next";
import { VendorsListPage } from "../_components/vendors-list-page";

export const metadata: Metadata = {
  title: "Suspended Vendors — Bagyes Rush Delivery",
};

export default async function SuspendedVendorsPage(props: PageProps<"/dashboard/vendors/suspended">) {
  return (
    <VendorsListPage
      title="Suspended vendors"
      description="Businesses barred from taking orders by an administrator."
      fixedStatus="suspended"
      searchParams={props.searchParams}
    />
  );
}
