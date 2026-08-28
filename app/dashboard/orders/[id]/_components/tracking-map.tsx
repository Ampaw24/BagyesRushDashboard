"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";

export type TrackingPoint = { lat: number; lng: number; label: string; kind: "rider" | "pickup" | "dropoff" };

/**
 * A live map of where a delivery has got to.
 *
 * OpenStreetMap tiles through Leaflet: no API key, no per-load billing, and it
 * ships working. The alternative needed a separate browser key from the server
 * routing one, domain-restricted, for the same three pins.
 *
 * Leaflet is imported dynamically inside an effect rather than at module scope:
 * it reaches for `window` on import, which throws during server rendering.
 */
export function TrackingMap({ points }: { points: TrackingPoint[] }) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const line = useRef<Polyline | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !container.current) return;

      if (!map.current) {
        map.current = L.map(container.current, { attributionControl: true });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map.current);
      }

      // Redrawn wholesale on every position update. Three markers is far too
      // few for diffing to be worth the bookkeeping.
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      line.current?.remove();

      const colours: Record<TrackingPoint["kind"], string> = {
        rider: "#e91d26",
        pickup: "#2a78d6",
        dropoff: "#0ca30c",
      };

      for (const point of points) {
        const icon = L.divIcon({
          className: "",
          html: `<span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:9999px;background:${colours[point.kind]};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([point.lat, point.lng], { icon })
          .addTo(map.current!)
          .bindTooltip(point.label, { direction: "top", offset: [0, -12] });

        markers.current.push(marker);
      }

      if (points.length > 1) {
        line.current = L.polyline(
          points.map((point) => [point.lat, point.lng] as [number, number]),
          { color: "#898781", weight: 2, dashArray: "6 6" },
        ).addTo(map.current);
      }

      if (points.length === 1) {
        map.current.setView([points[0].lat, points[0].lng], 14);
      } else if (points.length > 1) {
        map.current.fitBounds(
          L.latLngBounds(points.map((point) => [point.lat, point.lng] as [number, number])),
          { padding: [40, 40], maxZoom: 15 },
        );
      }

      // Leaflet measures its container on creation; inside a panel that was
      // hidden a moment ago it measures zero and renders one grey tile.
      setTimeout(() => map.current?.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
    };
  }, [points]);

  useEffect(() => {
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div
      ref={container}
      className="h-80 w-full overflow-hidden rounded-xl border border-border-subtle bg-surface-muted"
      // Leaflet writes inline positioning into this element; the surrounding
      // rounded border is ours.
    />
  );
}
