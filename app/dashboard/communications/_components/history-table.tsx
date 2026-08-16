"use client";

import Link from "next/link";
import { useCommunicationsFilter } from "../../_hooks/use-communications-filter";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { Badge } from "../../_components/status-badge";
import { SearchIcon } from "../../_lib/icons";
import { audienceRoleMeta, channelMeta, communicationStatusMeta, communicationTypeMeta } from "../../_lib/communications";
import { formatDateTime } from "../../_lib/format";
import type {
  Communication,
  CommunicationChannel,
  CommunicationStatus,
  CommunicationType,
} from "../../_services/communications-mock-data";

const STATUS_OPTIONS: (CommunicationStatus | "all")[] = ["all", "draft", "scheduled", "processing", "sent", "partially_sent", "failed", "cancelled"];
const CHANNEL_OPTIONS: (CommunicationChannel | "all")[] = ["all", "push", "email", "sms", "in_app"];
const TYPE_OPTIONS: (CommunicationType | "all")[] = ["all", "notification", "announcement", "promotional", "system_update", "maintenance", "general"];

function selectClass() {
  return "h-11 rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";
}

export function HistoryTable({ communications }: { communications: Communication[] }) {
  const { query, setQuery, status, setStatus, channel, setChannel, type, setType, filtered } = useCommunicationsFilter(communications);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, ID, or admin"
            className="h-11 w-full rounded-lg border border-border-subtle bg-surface pl-9 pr-3.5 text-sm text-foreground outline-none transition duration-150 placeholder:text-text-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectClass()}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : communicationStatusMeta[s].label}
            </option>
          ))}
        </select>

        <select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className={selectClass()}>
          {CHANNEL_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All channels" : channelMeta[c].label}
            </option>
          ))}
        </select>

        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={selectClass()}>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All types" : communicationTypeMeta[t].label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">No communications match your filters</p>
          <p className="text-sm text-text-muted">Try a different search term or filter.</p>
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Communication</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Channels</TableHeadCell>
              <TableHeadCell>Audience</TableHeadCell>
              <TableHeadCell>Recipients</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Admin</TableHeadCell>
              <TableHeadCell>Date</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/communications/history/${c.id}`} className="hover:text-brand">
                    {c.title}
                  </Link>
                </TableCell>
                <TableCell className="text-text-secondary">{communicationTypeMeta[c.type].label}</TableCell>
                <TableCell className="text-text-secondary">{c.channels.map((ch) => channelMeta[ch].label).join(" + ")}</TableCell>
                <TableCell className="text-text-secondary">
                  {c.audience.type === "all"
                    ? "All users"
                    : c.audience.type === "role"
                      ? c.audience.roles?.map((r) => audienceRoleMeta[r].label).join(" + ")
                      : c.audience.type === "segment"
                        ? c.audience.segment
                        : `${c.audience.userIds?.length ?? 0} users`}
                </TableCell>
                <TableCell className="text-text-secondary">{c.audience.resolvedCount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge meta={communicationStatusMeta[c.status]} />
                </TableCell>
                <TableCell className="text-text-secondary">{c.createdBy}</TableCell>
                <TableCell className="text-text-secondary">{formatDateTime(c.updatedAt)}</TableCell>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
