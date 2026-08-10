import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { VendorsTable } from "../_components/vendors-table";
import { getVendors } from "../../_services/vendors-mock-data";

export const metadata: Metadata = {
  title: "All Vendors — Bagyes Rush Delivery",
};

export default async function AllVendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="All vendors" description="Search and filter every vendor on the platform." />
      <VendorsTable vendors={vendors} />
    </div>
  );
}
