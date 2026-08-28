import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "../_components/page-header";
import { NoPermissionState } from "../_components/empty-state";
import { StatTile } from "../_components/stat-tile";
import { CommunicationsTable } from "./_components/communications-table";
import { listCommunications } from "@/lib/services/communications.service";
import { toCommunicationRow } from "@/lib/mappers/communication.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { BellIcon, CheckCircleIcon, ClockIcon, MegaphoneIcon } from "../_lib/icons";

export const metadata: Metadata = {
  title: "Communications — BagyesRUSH",
};

export default async function CommunicationsPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "communications.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Communications" description="Broadcasts to customers, vendors and riders." />
        <NoPermissionState what="communications" />
      </div>
    );
  }

  const canSend = can(permissions, "communications.send");

  // Three cheap counts rather than a stats endpoint: the totals come from the
  // pagination block, so this is one row of data per tile and no new route.
  const [recent, scheduled, sent] = await Promise.all([
    listCommunications({ per_page: 10 }),
    listCommunications({ per_page: 1, status: "scheduled" }),
    listCommunications({ per_page: 1, status: "sent" }),
  ]);

  const reached = recent.items.reduce((total, item) => total + item.sent_count, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Communications"
        description="Broadcasts to customers, vendors and riders — and what actually reached them."
        action={
          canSend && (
            <Link
              href="/dashboard/communications/new"
              className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
            >
              New communication
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total sent"
          value={sent.pagination.total.toLocaleString()}
          icon={<CheckCircleIcon />}
        />
        <StatTile
          label="Scheduled"
          value={scheduled.pagination.total.toLocaleString()}
          icon={<ClockIcon />}
        />
        <StatTile
          label="All communications"
          value={recent.pagination.total.toLocaleString()}
          icon={<MegaphoneIcon />}
        />
        <StatTile
          label="Reached in the last 10"
          value={reached.toLocaleString()}
          icon={<BellIcon />}
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent</h2>
          <Link
            href="/dashboard/communications/history"
            className="text-sm text-text-muted transition duration-150 hover:text-foreground"
          >
            View all
          </Link>
        </div>

        <CommunicationsTable
          communications={recent.items.map(toCommunicationRow)}
          pagination={recent.pagination}
          canSend={canSend}
          showFilters={false}
          emptyDescription="Nothing has been sent yet. Compose one to reach customers, vendors or riders."
        />
      </section>
    </div>
  );
}
