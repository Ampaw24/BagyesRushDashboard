import { formatDateTime } from "../../_lib/format";
import type { ActivityRow } from "@/lib/mappers/activity.mapper";

/**
 * Who did what to this order, newest first.
 *
 * The question it answers comes up on every disputed order — "who cancelled
 * this?", "who refunded it, and why?" — and before it the answer meant leaving
 * the order for the audit log and searching for its number.
 */
export function OrderHistory({ entries }: { entries: ActivityRow[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-border-subtle p-6 text-center text-sm text-text-muted">
        No staff have changed this order. Everything the customer, vendor and rider did is on the
        timeline.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle">
        {entries.map((entry) => {
          const notes = noteLines(entry);

          return (
            <li key={entry.id} className="flex flex-col gap-1 px-4 py-3">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="break-words text-sm font-medium text-foreground">
                  {entry.description}
                </span>
                <span className="shrink-0 text-xs text-text-muted">
                  {formatDateTime(entry.createdAt)}
                </span>
              </span>

              <span className="break-words text-xs text-text-secondary">
                By <span className="font-medium text-foreground">{entry.adminEmail}</span>
                {entry.adminRole && ` · ${humaniseRole(entry.adminRole)}`}
              </span>

              {notes.map((note) => (
                <span
                  key={note.label}
                  className="break-words rounded-lg bg-surface-muted px-3 py-2 text-xs text-text-secondary"
                >
                  <span className="font-medium text-foreground">{note.label}: </span>
                  {note.value}
                </span>
              ))}
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-text-muted">
        Staff actions only, newest first. The full trail, with IP addresses, is in the audit log.
      </p>
    </div>
  );
}

/**
 * The free text an admin wrote with the action — the reason for a
 * cancellation, a refund, a resolution, or what a support reply said. The
 * rest of `properties` is machine detail the description already states.
 */
const NOTE_KEYS: Record<string, string> = {
  reason: "Reason",
  note: "Note",
  excerpt: "Message",
};

function noteLines(entry: ActivityRow): { label: string; value: string }[] {
  const properties = entry.properties ?? {};

  return Object.entries(NOTE_KEYS).flatMap(([key, label]) => {
    const value = properties[key];
    return typeof value === "string" && value.trim() !== "" ? [{ label, value }] : [];
  });
}

/** `super_admin` → "Super admin". */
function humaniseRole(role: string): string {
  const words = role.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
