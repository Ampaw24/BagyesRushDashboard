import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { CommunicationsTable } from "../_components/communications-table";
import { listCommunications } from "@/lib/services/communications.service";
import { toCommunicationRow } from "@/lib/mappers/communication.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readEnumParam } from "@/lib/api/query";
import { COMMUNICATION_CHANNELS, COMMUNICATION_STATUSES } from "@/lib/types/enums";

export const metadata: Metadata = {
  title: "Communication History — BagyesRUSH",
};

export default async function CommunicationsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const permissions = await getPermissions();

  if (!can(permissions, "communications.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="History" description="Every communication sent, scheduled, or drafted." />
        <NoPermissionState what="communications" />
      </div>
    );
  }

  const params = await searchParams;
  const list = parseListParams(params);

  const page = await listCommunications({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    status: readEnumParam(params, "status", COMMUNICATION_STATUSES),
    channel: readEnumParam(params, "channel", COMMUNICATION_CHANNELS),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="History"
        description="Every communication sent, scheduled, or drafted."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} communication
            {page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      <CommunicationsTable
        communications={page.items.map(toCommunicationRow)}
        pagination={page.pagination}
        canSend={can(permissions, "communications.send")}
      />
    </div>
  );
}
