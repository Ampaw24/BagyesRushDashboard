"use client";

import Link from "next/link";

import { Avatar } from "../../../_components/avatar";
import type { RiderLiveDto } from "@/lib/types/api";

/**
 * Who is on the map, and everything about whoever is selected.
 *
 * Doubles as the list and the detail: clicking a row pans the map to that
 * rider, and clicking a marker selects the row. A dispatcher looking for one
 * person by name should not have to hunt for their dot.
 */
export function RiderDetailPanel({
  rider,
  riders,
  onSelect,
  onClear,
}: {
  rider: RiderLiveDto | null;
  riders: RiderLiveDto[];
  onSelect: (riderId: number) => void;
  onClear: () => void;
}) {
  if (rider) {
    return (
      <div className="flex max-h-[34rem] flex-col overflow-y-auto rounded-xl border border-border-subtle bg-surface p-4">
        <button
          type="button"
          onClick={onClear}
          className="mb-3 self-start text-xs font-medium text-muted hover:text-foreground"
        >
          ← All riders
        </button>

        <div className="flex items-center gap-3">
          {/* One component for both branches: the hand-rolled <img> here had
              no initials fallback and no zoom, so a rider with a stale photo
              URL showed a torn-image glyph on the dispatch map. */}
          <Avatar
            name={rider.name}
            src={rider.photo_url}
            className="h-12 w-12 text-sm"
            zoomable
            caption={rider.name}
          />

          <div className="min-w-0">
            <p className="truncate font-semibold">{rider.name}</p>
            <p className="truncate text-xs text-muted">
              {rider.vehicle_type_label ?? rider.vehicle_type ?? "Rider"}
              {rider.plate_number ? ` · ${rider.plate_number}` : ""}
            </p>
          </div>
        </div>

        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <Row label="Phone">
            {rider.phone ? (
              <a href={`tel:${rider.phone}`} className="text-brand hover:underline">
                {rider.phone}
              </a>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Rating">
            {rider.rating > 0 ? `${rider.rating.toFixed(1)} ★` : "Not rated yet"}
          </Row>
          <Row label="Deliveries">{rider.deliveries_completed.toLocaleString()}</Row>
          <Row label="Speed">
            {rider.speed_kph !== null ? `${Math.round(rider.speed_kph)} km/h` : "—"}
          </Row>
          <Row label="Last seen">{lastSeen(rider)}</Row>
        </dl>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Carrying ({rider.active_order_count})
          </p>

          {rider.active_orders.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {rider.active_orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="block rounded-lg border border-border-subtle p-2 hover:border-brand"
                  >
                    <span className="block text-sm font-medium">{order.order_number}</span>
                    <span className="block text-xs text-muted">{order.status_label}</span>
                    {order.delivery_address ? (
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {order.delivery_address}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              {rider.active_order_count > 0
                ? `${rider.active_order_count} job(s) — reload for the details.`
                : "Nothing on board."}
            </p>
          )}
        </div>

        <Link
          href={`/dashboard/riders/${rider.rider_id}`}
          className="mt-4 rounded-lg bg-brand px-3 py-2 text-center text-sm font-medium text-white hover:opacity-90"
        >
          Open rider profile
        </Link>
      </div>
    );
  }

  return (
    <div className="flex max-h-[34rem] flex-col overflow-y-auto rounded-xl border border-border-subtle bg-surface p-2">
      {riders.length === 0 ? (
        <p className="p-4 text-sm text-muted">
          Nobody is reporting a position right now. Riders appear here as soon as they go online
          and their app sends a fix.
        </p>
      ) : (
        <ul className="flex flex-col">
          {riders.map((entry) => (
            <li key={entry.rider_id}>
              <button
                type="button"
                onClick={() => onSelect(entry.rider_id)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-surface-muted"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    entry.is_stale
                      ? "bg-muted"
                      : entry.active_order_count > 0
                        ? "bg-red-500"
                        : "bg-emerald-500"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{entry.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {entry.active_order_count > 0
                      ? `${entry.active_order_count} on board`
                      : "Idle"}
                    {" · "}
                    {lastSeen(entry)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="truncate text-right">{children}</dd>
    </div>
  );
}

/**
 * How old the fix is.
 *
 * Shown even when it is fresh, because "3s ago" is the only thing on the screen
 * that distinguishes a working feed from a frozen one.
 */
function lastSeen(rider: RiderLiveDto): string {
  const seconds = rider.location_age_seconds;

  if (seconds === null) return "never";
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;

  return `${Math.floor(seconds / 3600)}h ago`;
}
