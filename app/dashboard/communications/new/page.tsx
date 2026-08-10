import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { CommunicationComposer } from "../_components/communication-composer";
import {
  getAudienceDirectory,
  getAudienceSegments,
  getCommunicationTemplates,
  type CommunicationType,
} from "../../_services/communications-mock-data";

export const metadata: Metadata = {
  title: "Create Communication — Bagyes Rush Delivery",
};

const VALID_TYPES: CommunicationType[] = ["notification", "announcement", "promotional", "system_update", "maintenance", "general"];

export default async function NewCommunicationPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; template?: string }>;
}) {
  const params = await searchParams;
  const [directory, segments, templates] = await Promise.all([
    getAudienceDirectory(),
    getAudienceSegments(),
    getCommunicationTemplates(),
  ]);

  const initialType: CommunicationType = VALID_TYPES.includes(params.type as CommunicationType)
    ? (params.type as CommunicationType)
    : "notification";
  const template = params.template ? templates.find((t) => t.id === params.template) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Create communication" description="Reach riders and customers across push, email, SMS, and in-app channels." />
      <CommunicationComposer directory={directory} segments={segments} initialType={initialType} template={template} />
    </div>
  );
}
