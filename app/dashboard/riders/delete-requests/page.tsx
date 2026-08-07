import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getRiderDeleteRequests } from "../../_services/mock-data";
import { DeleteRequestsTable } from "./delete-requests-table";

export const metadata: Metadata = {
  title: "Delete Requests — Bagyes Rush Delivery",
};

export default async function DeleteRequestsPage() {
  const requests = await getRiderDeleteRequests();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Delete requests" description="Riders who asked to have their account removed." />
      <DeleteRequestsTable requests={requests} />
    </div>
  );
}
