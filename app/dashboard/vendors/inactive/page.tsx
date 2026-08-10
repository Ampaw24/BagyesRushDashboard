import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { VendorsTable } from "../_components/vendors-table";
import { getVendors } from "../../_services/vendors-mock-data";

export const metadata: Metadata = {
  title: "Inactive Vendors — Bagyes Rush Delivery",
};

export default async function InactiveVendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inactive vendors" description="Vendors that have gone dormant." />
      <VendorsTable vendors={vendors} initialStatus="inactive" />
    </div>
  );
}
