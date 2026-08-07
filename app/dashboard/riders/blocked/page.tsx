import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getBlockedRiders } from "../../_services/mock-data";
import { BlockedTable } from "./blocked-table";

export const metadata: Metadata = {
  title: "Blocked Riders — Bagyes Rush Delivery",
};

export default async function BlockedRidersPage() {
  const riders = await getBlockedRiders();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Blocked riders" description="Riders suspended from taking new deliveries." />
      <BlockedTable riders={riders} />
    </div>
  );
}
