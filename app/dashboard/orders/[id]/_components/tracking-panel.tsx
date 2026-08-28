"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatDateTime } from "../../../_lib/format";
import type { TrackingPoint } from "./tracking-map";
import type { OrderDetail } from "@/lib/mappers/order.mapper";

// Leaflet touches `window` on import, so the map cannot be server-rendered.
const TrackingMap = dynamic(() => import("./tracking-map").then((m) => m.TrackingMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 w-full items-center justify-center rounded-xl border border-border-subtle bg-surface-muted text-sm text-text-muted">
      Loading map…
    </div>
  ),
});

/** How often to re-read the rider's position while the panel is open. */
const REFRESH_MS = 20_000;

/**
 * Where a delivery has got to, on a map.
 *
 * Collapsed by default and only offered on an order that is actually moving:
 * a map of a delivered order is a map of where somebody used to be, and one on
 * an unassigned order has a single pin on it.
 *
 * Refreshes by asking the server component to re-render rather than polling an
 * API from the browser — the position comes down with the order it belongs to,
 * so there is one source of truth for both.
 */
export function TrackingPanel({ order }: { order: OrderDetail }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const rider = order.rider;
  const points: TrackingPoint[] = [];

  if (order.pickup?.latitude != null && order.pickup?.longitude != null) {
    points.push({
      lat: order.pickup.latitude,
      lng: order.pickup.longitude,
      label: `Pick up · ${order.pickup.name ?? order.pickup.address ?? "Collection point"}`,
      kind: "pickup",
    });
  }

  if (rider?.latitude != null && rider?.longitude != null) {
    points.push({
      lat: rider.latitude,
      lng: rider.longitude,
      label: `${rider.name ?? "Rider"} · ${rider.plateNumber ?? "on the way"}`,
      kind: "rider",
    });
  }

  if (order.dropoffLatitude != null && order.dropoffLongitude != null) {
    points.push({
      lat: order.dropoffLatitude,
      lng: order.dropoffLongitude,
      label: `Drop off · ${order.address}`,
      kind: "dropoff",
    });
  }

  // Only poll while somebody is looking at it. A background tab refreshing an
  // admin dashboard every twenty seconds is a cost nobody asked for.
  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => router.refresh(), REFRESH_MS);

    return () => clearInterval(timer);
  }, [open, router]);

  if (points.length === 0) {
    return null;
  }

  const hasRider = points.some((point) => point.kind === "rider");

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-foreground">Tracking</h2>
          <p className="text-xs text-text-muted">
            {hasRider
              ? rider?.locationUpdatedAt
                ? `Rider last reported ${formatDateTime(rider.locationUpdatedAt)}`
                : "The rider has not reported a position yet."
              : "No rider position — showing the pickup and drop-off only."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 items-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          {open ? "Hide map" : "Track on map"}
        </button>
      </div>

      {open && (
        <>
          <TrackingMap points={points} />

          <div className="flex flex-wrap gap-4 text-xs text-text-muted">
            <Legend colour="#2a78d6" label="Pick up" />
            {hasRider && <Legend colour="#e91d26" label="Rider" />}
            <Legend colour="#0ca30c" label="Drop off" />
            <span className="ml-auto">Refreshes every {REFRESH_MS / 1000}s while open</span>
          </div>
        </>
      )}
    </section>
  );
}

function Legend({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full border-2 border-white shadow"
        style={{ background: colour }}
      />
      {label}
    </span>
  );
}
