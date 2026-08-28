import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { Composer } from "../_components/composer";
import { listCommunicationTemplates } from "@/lib/services/communications.service";
import { toCommunicationTemplateRow } from "@/lib/mappers/communication.mapper";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "New Communication — BagyesRUSH",
};

export default async function NewCommunicationPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "communications.send")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="New communication" description="Compose a message to send." />
        <NoPermissionState what="sending communications" />
      </div>
    );
  }

  const templates = await listCommunicationTemplates({ per_page: 100, is_active: true });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New communication"
        description="Pick who it goes to, then see how many people that is before you send it."
      />
      <Composer templates={templates.items.map(toCommunicationTemplateRow)} />
    </div>
  );
}
