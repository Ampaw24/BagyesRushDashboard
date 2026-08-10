import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { VendorsTable } from "../_components/vendors-table";
import { getVendors } from "../../_services/vendors-mock-data";

export const metadata: Metadata = {
  title: "Vendor Applications — Bagyes Rush Delivery",
};

export default async function VendorApplicationsPage() {
  const vendors = await getVendors();
  const applications = vendors.filter((v) => v.verificationStatus === "pending" || v.verificationStatus === "requires_review");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Vendor applications" description="New vendor onboarding submissions awaiting review." />
      <VendorsTable vendors={applications} />
    </div>
  );
}
