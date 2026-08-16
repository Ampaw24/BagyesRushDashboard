import { useMemo, useState } from "react";
import type { Communication, CommunicationChannel, CommunicationStatus, CommunicationType } from "../_services/communications-mock-data";

export type CommunicationStatusFilter = CommunicationStatus | "all";
export type CommunicationChannelFilter = CommunicationChannel | "all";
export type CommunicationTypeFilter = CommunicationType | "all";

export function useCommunicationsFilter(communications: Communication[]) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CommunicationStatusFilter>("all");
  const [channel, setChannel] = useState<CommunicationChannelFilter>("all");
  const [type, setType] = useState<CommunicationTypeFilter>("all");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return communications.filter((c) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        c.title.toLowerCase().includes(normalizedQuery) ||
        c.id.toLowerCase().includes(normalizedQuery) ||
        c.createdBy.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "all" || c.status === status;
      const matchesChannel = channel === "all" || c.channels.includes(channel);
      const matchesType = type === "all" || c.type === type;
      return matchesQuery && matchesStatus && matchesChannel && matchesType;
    });
  }, [communications, query, status, channel, type]);

  return { query, setQuery, status, setStatus, channel, setChannel, type, setType, filtered };
}
