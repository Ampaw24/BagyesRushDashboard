import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { ScheduledTable } from "../_components/scheduled-table";
import { getScheduledCommunications } from "../../_services/communications-mock-data";

export const metadata: Metadata = {
  title: "Scheduled — Bagyes Rush Delivery",
};

export default async function ScheduledPage() {
  const communications = await getScheduledCommunications();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Scheduled" description="Communications queued to send at a future date and time." />
      <ScheduledTable communications={communications} />
    </div>
  );
}
