import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { VendorComposer } from "../_components/vendor-composer";
import { getCustomers } from "../../_services/mock-data";

export const metadata: Metadata = {
  title: "Add Vendor — Bagyes Rush Delivery",
};

export default async function NewVendorPage() {
  const customers = await getCustomers();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Add vendor" description="Onboard a new food vendor onto Bagyes Rush." />
      <VendorComposer customers={customers} />
    </div>
  );
}
