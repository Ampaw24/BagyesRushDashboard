import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getRiderApplications } from "../../_services/mock-data";
import { RequestsTable } from "./requests-table";

export const metadata: Metadata = {
  title: "Rider Requests — Bagyes Rush Delivery",
};

export default async function RiderRequestsPage() {
  const applications = await getRiderApplications();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Rider requests" description="Review and approve new riders who applied to join." />
      <RequestsTable applications={applications} />
    </div>
  );
}
