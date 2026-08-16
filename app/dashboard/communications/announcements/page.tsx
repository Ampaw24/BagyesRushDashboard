import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "../../_components/page-header";
import { Badge } from "../../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { PlusIcon } from "../../_lib/icons";
import { announcementPriorityMeta, audienceRoleMeta, communicationStatusMeta } from "../../_lib/communications";
import { formatDate } from "../../_lib/format";
import { getAnnouncements } from "../../_services/communications-mock-data";

export const metadata: Metadata = {
  title: "Announcements — Bagyes Rush Delivery",
};

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Announcements"
        description="Publish banners and alerts that appear prominently inside the mobile app."
        action={
          <Link
            href="/dashboard/communications/new?type=announcement"
            className="flex h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            <PlusIcon className="h-4 w-4" />
            New announcement
          </Link>
        }
      />

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">No announcements yet</p>
          <p className="text-sm text-text-muted">Create one to show a banner inside the mobile app.</p>
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Announcement</TableHeadCell>
              <TableHeadCell>Priority</TableHeadCell>
              <TableHeadCell>Audience</TableHeadCell>
              <TableHeadCell>Visible</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {announcements.map((a) => (
              <tr key={a.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/communications/history/${a.id}`} className="hover:text-brand">
                    {a.title}
                  </Link>
                </TableCell>
                <TableCell>{a.announcement && <Badge meta={announcementPriorityMeta[a.announcement.priority]} />}</TableCell>
                <TableCell className="text-text-secondary">
                  {a.audience.type === "all"
                    ? "All users"
                    : a.audience.type === "role"
                      ? a.audience.roles?.map((r) => audienceRoleMeta[r].label).join(" + ")
                      : a.audience.type === "segment"
                        ? a.audience.segment
                        : `${a.audience.userIds?.length ?? 0} users`}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {a.announcement
                    ? `${formatDate(a.announcement.startAt)}${a.announcement.expiresAt ? ` – ${formatDate(a.announcement.expiresAt)}` : ""}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge meta={communicationStatusMeta[a.status]} />
                </TableCell>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
