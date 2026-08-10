import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { TemplatesManager } from "../_components/templates-manager";
import { getCommunicationTemplates } from "../../_services/communications-mock-data";

export const metadata: Metadata = {
  title: "Templates — Bagyes Rush Delivery",
};

export default async function TemplatesPage() {
  const templates = await getCommunicationTemplates();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Templates" description="Reusable message templates for common communications." />
      <TemplatesManager initialTemplates={templates} />
    </div>
  );
}
