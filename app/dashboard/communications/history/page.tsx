import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { HistoryTable } from "../_components/history-table";
import { getCommunications } from "../../_services/communications-mock-data";

export const metadata: Metadata = {
  title: "Communication History — Bagyes Rush Delivery",
};

export default async function CommunicationsHistoryPage() {
  const communications = await getCommunications();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="History" description="Every communication that has been sent, scheduled, or drafted." />
      <HistoryTable communications={communications} />
    </div>
  );
}
