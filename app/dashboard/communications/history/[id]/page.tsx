import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "../../../_components/page-header";
import { StatTile } from "../../../_components/stat-tile";
import { Meter } from "../../../_components/meter";
import { Badge } from "../../../_components/status-badge";
import { DistributionBar } from "../../../_components/distribution-bar";
import {
  audienceRoleMeta,
  channelMeta,
  communicationStatusMeta,
  communicationTypeMeta,
} from "../../../_lib/communications";
import { CheckCircleIcon, ClockIcon, UsersIcon, XCircleIcon } from "../../../_lib/icons";
import { formatDateTime } from "../../../_lib/format";
import { getCommunicationById } from "../../../_services/communications-mock-data";
import type { Audience, CommunicationChannel } from "../../../_services/communications-mock-data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const communication = await getCommunicationById(id);
  return { title: communication ? `${communication.title} — Bagyes Rush Delivery` : "Communication — Bagyes Rush Delivery" };
}

function audienceLabel(audience: Audience) {
  if (audience.type === "all") return "All users";
  if (audience.type === "role") return audience.roles?.map((r) => audienceRoleMeta[r].label).join(" + ") ?? "";
  if (audience.type === "segment") return audience.segment ?? "";
  return `${audience.userIds?.length ?? 0} selected users`;
}

export default async function CommunicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const communication = await getCommunicationById(id);
  if (!communication) notFound();

  const channels = Object.keys(communication.stats) as CommunicationChannel[];
  const totals = channels.reduce(
    (acc, channel) => {
      const s = communication.stats[channel];
      if (!s) return acc;
      acc.delivered += s.delivered;
      acc.opened += s.opened;
      acc.clicked += s.clicked;
      acc.failed += s.failed;
      return acc;
    },
    { delivered: 0, opened: 0, clicked: 0, failed: 0 }
  );

  const recipients = communication.audience.resolvedCount;
  const deliveryRate = recipients > 0 ? (totals.delivered / recipients) * 100 : 0;
  const openRate = totals.delivered > 0 ? (totals.opened / totals.delivered) * 100 : 0;
  const clickRate = totals.opened > 0 ? (totals.clicked / totals.opened) * 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={communication.title}
        description={`${communicationTypeMeta[communication.type].label} · ${communication.channels.map((c) => channelMeta[c].label).join(" + ")}`}
        action={<Badge meta={communicationStatusMeta[communication.status]} />}
      />

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-text-muted">Audience</p>
          <p className="text-sm font-medium text-foreground">{audienceLabel(communication.audience)}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Created by</p>
          <p className="text-sm font-medium text-foreground">{communication.createdBy}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">{communication.scheduledAt ? "Scheduled for" : "Sent at"}</p>
          <p className="text-sm font-medium text-foreground">
            {communication.sentAt ? formatDateTime(communication.sentAt) : communication.scheduledAt ? formatDateTime(communication.scheduledAt) : "Not scheduled"}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Last updated</p>
          <p className="text-sm font-medium text-foreground">{formatDateTime(communication.updatedAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Recipients" value={recipients.toLocaleString()} icon={<UsersIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Delivered" value={totals.delivered.toLocaleString()} icon={<CheckCircleIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Opened" value={totals.opened.toLocaleString()} icon={<ClockIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Failed" value={totals.failed.toLocaleString()} icon={<XCircleIcon className="h-4.5 w-4.5" />} />
      </div>

      {channels.length > 0 && (
        <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Delivered by channel</h3>
          <DistributionBar
            ariaLabel="Delivered by channel"
            segments={channels.map((channel) => ({
              key: channel,
              label: channelMeta[channel].label,
              value: communication.stats[channel]?.delivered ?? 0,
              colorClassName: channelMeta[channel].colorClassName,
            }))}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Meter label="Delivery rate" value={deliveryRate} icon={<CheckCircleIcon className="h-4.5 w-4.5" />} />
        <Meter label="Open rate" value={openRate} icon={<ClockIcon className="h-4.5 w-4.5" />} />
        <Meter label="Click rate" value={clickRate} icon={<UsersIcon className="h-4.5 w-4.5" />} />
      </div>
    </div>
  );
}
