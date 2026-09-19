"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import type { Map as LeafletMap, Marker } from "leaflet";

import { EmptyState } from "../../../_components/empty-state";
import { ACCRA, glide, riderIconOptions, riderTooltip } from "../../_components/rider-marker";
import { formatDateTimeOrDash } from "../../../_lib/format";
import { useRiderPositions } from "@/lib/realtime/use-rider-positions";
import { REALTIME_CONFIGURED } from "@/lib/api/config";
import type { RiderDetail } from "@/lib/mappers/rider.mapper";
import type { RiderLiveDto } from "@/lib/types/api";

/**
 * Where one rider is, right now.
 *
 * The dispatch map answers "where is everybody"; this answers "where is this
 * person", which is the question being asked when somebody opens a rider's
 * profile because a customer is on the phone about a delivery that has not
 * arrived.
 *
 * It subscribes to the same `admin.riders` channel and filters to this rider
 * rather than opening a per-rider feed: the socket is already there, the
 * merging and staleness rules already exist in `useRiderPositions`, and one set
 * of rules is the point.
 */
export function RiderLocationMap({ rider }: { rider: RiderDetail }) {
  // A one-element seed built from the detail response, so there is a marker on
  // first paint rather than after the socket connects.
  const seed = useMemo<RiderLiveDto[]>(() => [toLiveDto(rider)], [rider]);

  const { riders, connection } = useRiderPositions(seed);
  const live = riders.find((candidate) => candidate.rider_id === rider.id) ?? seed[0];

  const hasFix = live.latitude !== null && live.longitude !== null;

  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const hasCentred = useRef(false);

  // Create the map once. Leaflet is imported inside the effect because it
  // reaches for `window` at module scope and throws during server rendering.
  useEffect(() => {
    if (!hasFix) return;

    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !container.current || map.current) return;

      map.current = L.map(container.current, { attributionControl: true }).setView(ACCRA, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map.current);

      // Leaflet measures its container on creation. This tab was display:none a
      // moment ago, so it measures zero and paints one grey tile without this.
      setTimeout(() => map.current?.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
    };
  }, [hasFix]);

  // Keep the single marker on the latest fix.
  useEffect(() => {
    if (!hasFix) return;

    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !map.current) return;

      const position: [number, number] = [live.latitude!, live.longitude!];

      if (marker.current) {
        // Moved rather than replaced: recreating it restarts the CSS transition
        // and makes the bike blink instead of glide.
        marker.current.setLatLng(position);
        marker.current.setIcon(L.divIcon(riderIconOptions(live)));
        marker.current.setTooltipContent(riderTooltip(live));
      } else {
        marker.current = L.marker(position, { icon: L.divIcon(riderIconOptions(live)) })
          .addTo(map.current)
          .bindTooltip(riderTooltip(live), { direction: "top", offset: [0, -26] });
      }

      glide(marker.current);

      // Centred once. Recentring on every fix would yank the view away from
      // somebody who had panned deliberately to see where the rider is headed.
      if (!hasCentred.current) {
        hasCentred.current = true;
        map.current.setView(position, 15, { animate: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [live, hasFix]);

  useEffect(() => {
    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  if (!hasFix) {
    return (
      <EmptyState
        title="This rider has never reported a position"
        description={
          rider.isOnline
            ? "They are online but their phone has not sent a fix yet. Positions arrive once they start moving."
            : "Positions are only sent while a rider is online. There is nothing to draw yet."
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_18rem]">
      <div
        ref={container}
        className="h-[30rem] w-full overflow-hidden rounded-xl border border-border-subtle bg-surface-muted"
      />

      <aside className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="break-words text-sm font-semibold text-foreground">Last fix</h2>
          <ConnectionDot state={connection} stale={live.is_stale} />
        </div>

        <dl className="flex flex-col gap-2">
          <Row label="Reported" value={formatDateTimeOrDash(toDate(live.recorded_at))} />
          <Row label="Age" value={formatAge(live.location_age_seconds)} />
          <Row
            label="Coordinates"
            value={`${live.latitude!.toFixed(5)}, ${live.longitude!.toFixed(5)}`}
          />
          <Row
            label="Speed"
            value={live.speed_kph !== null ? `${Math.round(live.speed_kph)} km/h` : "—"}
          />
          <Row label="Heading" value={live.heading !== null ? `${Math.round(live.heading)}°` : "—"} />
          <Row
            label="Accuracy"
            value={live.accuracy_m !== null ? `±${Math.round(live.accuracy_m)} m` : "—"}
          />
        </dl>

        {live.is_stale && (
          // "Last seen here twenty minutes ago" is how somebody notices a dead
          // phone, which is why a stale fix is shown and flagged rather than
          // hidden.
          <p className="break-words rounded-lg bg-status-warning/10 px-3 py-2 text-xs text-text-secondary">
            This fix is old. The marker shows where they were, not where they are.
          </p>
        )}

        <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
          <h2 className="break-words text-sm font-semibold text-foreground">
            Carrying {live.active_order_count === 0 ? "nothing" : `${live.active_order_count}`}
          </h2>
          {live.active_orders.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/orders/${order.id}`}
              className="flex flex-col gap-0.5 rounded-lg bg-surface-muted px-3 py-2 transition duration-150 hover:opacity-80"
            >
              <span className="break-words text-sm font-medium text-foreground">
                {order.order_number}
              </span>
              <span className="break-words text-xs text-text-muted">
                {order.status_label}
                {order.delivery_address ? ` · ${order.delivery_address}` : ""}
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/dashboard/riders/live"
          className="flex h-11 items-center justify-center rounded-lg border border-border-subtle text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          Open the dispatch map
        </Link>
      </aside>
    </div>
  );
}

function ConnectionDot({ state, stale }: { state: string; stale: boolean }) {
  const { label, tone } = !REALTIME_CONFIGURED
    ? { label: "Live updates off", tone: "bg-zinc-400" }
    : state === "live"
      ? stale
        ? { label: "Live · no recent fix", tone: "bg-status-warning" }
        : { label: "Live", tone: "bg-status-good" }
      : state === "connecting"
        ? { label: "Connecting…", tone: "bg-status-warning" }
        : { label: "Reconnecting…", tone: "bg-status-critical" };

  return (
    <span className="flex items-center gap-1.5 text-xs text-text-muted">
      <span className={`h-2 w-2 shrink-0 rounded-full ${tone}`} />
      {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="break-words text-xs text-text-muted">{label}</dt>
      <dd className="break-words text-right text-sm text-foreground">{value}</dd>
    </div>
  );
}

function toDate(value: string | null): Date | null {
  return value ? new Date(value) : null;
}

function formatAge(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;

  return `${Math.round(seconds / 3600)} h ago`;
}

/**
 * The detail response and the live feed describe the same rider in two shapes.
 *
 * Converting here rather than teaching the hook a second shape keeps one merge
 * rule for both maps — and the fields a detail response does not carry (what
 * they are currently carrying) fill in from the first socket frame.
 */
function toLiveDto(rider: RiderDetail): RiderLiveDto {
  return {
    rider_id: rider.id,
    user_id: rider.userId,
    name: rider.name,
    photo_url: rider.photoUrl,
    phone: rider.phone,
    vehicle_type: rider.vehicleType,
    vehicle_type_label: rider.vehicleTypeLabel,
    plate_number: rider.plateNumber,
    latitude: rider.currentLatitude,
    longitude: rider.currentLongitude,
    // A detail response carries the position but not the motion around it;
    // those arrive with the first live frame.
    heading: null,
    speed_kph: null,
    accuracy_m: null,
    recorded_at: rider.locationUpdatedAt ? rider.locationUpdatedAt.toISOString() : null,
    location_age_seconds: null,
    is_stale: true,
    is_online: rider.isOnline,
    status: rider.status,
    rating: rider.rating,
    deliveries_completed: rider.deliveriesCompleted,
    active_orders: [],
    active_order_count: 0,
  };
}
