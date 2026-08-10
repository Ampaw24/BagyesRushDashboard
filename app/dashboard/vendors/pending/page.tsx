import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { VendorsTable } from "../_components/vendors-table";
import { getVendors } from "../../_services/vendors-mock-data";

export const metadata: Metadata = {
  title: "Pending Vendors — Bagyes Rush Delivery",
};

export default async function PendingVendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Pending vendors" description="Vendors that haven't been approved to go live yet." />
      <VendorsTable vendors={vendors} initialStatus="pending" />
    </div>
  );
}
