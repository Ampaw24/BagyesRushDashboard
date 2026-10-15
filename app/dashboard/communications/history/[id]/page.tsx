import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "../../../_components/page-header";
import { NoPermissionState } from "../../../_components/empty-state";
import { Badge } from "../../../_components/status-badge";
import { Pagination } from "../../../_components/pagination";
import { communicationStatusMeta } from "../../../_lib/status";
import {
  CommunicationMessage,
  CommunicationRecipientsTable,
  CommunicationStats,
} from "../../_components/communication-detail";
import {
  getCommunication,
  listCommunicationRecipients,
} from "@/lib/services/communications.service";
import {
  toCommunicationRecipientRow,
  toCommunicationRow,
} from "@/lib/mappers/communication.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams } from "@/lib/api/query";
import { ApiRequestError } from "@/lib/api/errors";

export const metadata: Metadata = {
  title: "Communication — BagyesRUSH",
};

/**
 * One broadcast, and who it actually reached.
 *
 * The recipient table is the point of the page: the counters say "9,842 sent",
 * this says whether it reached that particular vendor, and why not when it
 * didn't.
 */
export default async function CommunicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const permissions = await getPermissions();

  if (!can(permissions, "communications.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Communication" description="One broadcast and its delivery." />
        <NoPermissionState what="communications" />
      </div>
    );
  }

  const { id } = await params;
  const communicationId = Number.parseInt(id, 10);

  if (!Number.isFinite(communicationId)) notFound();

  const list = parseListParams(await searchParams);

  let communication;
  try {
    communication = toCommunicationRow(await getCommunication(communicationId));
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }

  const recipients = await listCommunicationRecipients(communicationId, {
    page: list.page,
    per_page: list.per_page,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={communication.title}
        description={`${communication.channelLabel} to ${communication.audienceLabel.toLowerCase()}`}
        action={<Badge meta={communicationStatusMeta[communication.status]} />}
      />

      <CommunicationStats communication={communication} />

      <CommunicationMessage communication={communication} />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Delivery</h2>
          <Link
            href="/dashboard/communications/history"
            className="text-sm text-text-muted transition duration-150 hover:text-foreground"
          >
            Back to history
          </Link>
        </div>

        <CommunicationRecipientsTable rows={recipients.items.map(toCommunicationRecipientRow)} />

        <Pagination pagination={recipients.pagination} />
      </section>
    </div>
  );
}
