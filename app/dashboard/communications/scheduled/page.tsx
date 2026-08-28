import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { CommunicationsTable } from "../_components/communications-table";
import { listCommunications } from "@/lib/services/communications.service";
import { toCommunicationRow } from "@/lib/mappers/communication.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams } from "@/lib/api/query";

export const metadata: Metadata = {
  title: "Scheduled — BagyesRUSH",
};

/**
 * Waiting to go out.
 *
 * `communications:dispatch-scheduled` runs every minute and queues these when
 * their moment arrives, so a row sitting here past its time means the scheduler
 * is not running.
 */
export default async function ScheduledPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const permissions = await getPermissions();

  if (!can(permissions, "communications.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Scheduled" description="Communications queued to send later." />
        <NoPermissionState what="communications" />
      </div>
    );
  }

  const list = parseListParams(await searchParams);

  const page = await listCommunications({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    status: "scheduled",
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Scheduled"
        description="Communications queued to send at a future date and time."
      />
      <CommunicationsTable
        communications={page.items.map(toCommunicationRow)}
        pagination={page.pagination}
        canSend={can(permissions, "communications.send")}
        showFilters={false}
        emptyDescription="Nothing is scheduled. Anything with a send time will appear here until it goes out."
      />
    </div>
  );
}
