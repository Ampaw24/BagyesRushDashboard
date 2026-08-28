import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { TemplatesManager } from "../_components/templates-manager";
import { listCommunicationTemplates } from "@/lib/services/communications.service";
import { toCommunicationTemplateRow } from "@/lib/mappers/communication.mapper";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Templates — BagyesRUSH",
};

export default async function TemplatesPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "communications.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Templates" description="Reusable messages for common communications." />
        <NoPermissionState what="communications" />
      </div>
    );
  }

  const page = await listCommunicationTemplates({ per_page: 100 });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Templates"
        description="Reusable messages the composer can start from."
      />
      <TemplatesManager
        templates={page.items.map(toCommunicationTemplateRow)}
        canManage={can(permissions, "communications.send")}
      />
    </div>
  );
}
