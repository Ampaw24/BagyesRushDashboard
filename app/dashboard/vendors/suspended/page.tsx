import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { VendorsTable } from "../_components/vendors-table";
import { getVendors } from "../../_services/vendors-mock-data";

export const metadata: Metadata = {
  title: "Suspended Vendors — Bagyes Rush Delivery",
};

export default async function SuspendedVendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Suspended vendors" description="Vendors temporarily blocked from accepting new orders." />
      <VendorsTable vendors={vendors} initialStatus="suspended" />
    </div>
  );
}
