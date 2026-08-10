import { Badge } from "../../../_components/status-badge";
import { vendorStatusMeta } from "../../../_lib/vendors";
import { formatDateTime } from "../../../_lib/format";
import type { VendorStatusEvent } from "../../../_services/vendors-mock-data";

export function VendorActivityTab({ events }: { events: VendorStatusEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {event.previousStatus && <span className="text-xs text-text-muted">{vendorStatusMeta[event.previousStatus].label} →</span>}
              <Badge meta={vendorStatusMeta[event.newStatus]} />
            </div>
            {event.reason && <p className="break-words text-sm text-text-secondary">{event.reason}</p>}
            <p className="text-xs text-text-muted">by {event.changedBy}</p>
          </div>
          <p className="shrink-0 text-xs text-text-muted">{formatDateTime(event.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
