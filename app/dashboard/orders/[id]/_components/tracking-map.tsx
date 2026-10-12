"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";

import {
  freezeGlide,
  moveRiderMarker,
  rememberIcon,
  vehicleMarkerOptions,
} from "../../../riders/_components/rider-marker";

export type TrackingPoint = {
  lat: number;
  lng: number;
  label: string;
  kind: "rider" | "pickup" | "dropoff";
  /**
   * What the rider is riding, on the `rider` point only. Drawn as the vehicle
   * rather than a dot, so a rider does not read as a motorbike on the dispatch
   * map and an anonymous circle here - the two screens are looked at minutes
   * apart by the same person.
   */
  vehicleType?: string | null;
  /** Which way the rider is travelling, when the socket has said. */
  heading?: number | null;
};

const COLOURS: Record<TrackingPoint["kind"], string> = {
  rider: "#e91d26",
  pickup: "#2a78d6",
  dropoff: "#0ca30c",
};

/** A stable identity per point, so an update moves a marker instead of replacing it. */
function keyOf(point: TrackingPoint, index: number, points: TrackingPoint[]): string {
  const nth = points.slice(0, index).filter((other) => other.kind === point.kind).length;

  return `${point.kind}:${nth}`;
}

/**
 * A live map of where a delivery has got to.
 *
 * OpenStreetMap tiles through Leaflet: no API key, no per-load billing, and it
 * ships working. The alternative needed a separate browser key from the server
 * routing one, domain-restricted, for the same three pins.
 *
 * Markers are kept and moved, not redrawn: the rider glides from fix to fix the
 * same way as on the dispatch map (moveRiderMarker). This map used to delete
 * and recreate every marker and re-fit the view on each update, so the rider
 * teleported and the whole map jumped - throwing away any pan or zoom the
 * admin had made. The view is now fitted once, and again only when a point
 * appears or disappears.
 *
 * Leaflet is imported dynamically inside an effect rather than at module scope:
 * it reaches for `window` on import, which throws during server rendering.
 */
export function TrackingMap({ points }: { points: TrackingPoint[] }) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<Map<string, Marker>>(new Map());
  const line = useRef<Polyline | null>(null);
  const lineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fittedFor = useRef<string>("");

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

        // A glide lasts seconds; without this the rider would drift into place
        // after a zoom instead of snapping.
        map.current.on("zoomstart", () => markers.current.forEach(freezeGlide));
      }

      const leafletMap = map.current;
      const seen = new Set<string>();
      let glideMs = 0;

      points.forEach((point, index) => {
        const key = keyOf(point, index, points);
        seen.add(key);

        const position: [number, number] = [point.lat, point.lng];
        const existing = markers.current.get(key);

        // The rider gets the vehicle badge, with a pointer when there is a
        // heading; the pickup and drop-off stay plain dots, because they are
        // places rather than things that move.
        const options =
          point.kind === "rider"
            ? vehicleMarkerOptions({
                vehicleType: point.vehicleType ?? null,
                colour: COLOURS.rider,
                badge: 34,
                heading:
                  point.heading == null ? null : (Math.round(point.heading / 15) * 15) % 360,
              })
            : {
                className: "",
                html: `<span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:9999px;background:${COLOURS[point.kind]};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
                iconSize: [22, 22] as [number, number],
                iconAnchor: [11, 11] as [number, number],
              };

        if (existing) {
          if (point.kind === "rider") {
            glideMs = moveRiderMarker(existing, position, options.html, () =>
              existing.setIcon(L.divIcon(options)),
            );
          } else {
            const current = existing.getLatLng();

            // Places do not move; only set one that genuinely changed.
            if (current.lat !== point.lat || current.lng !== point.lng) {
              existing.setLatLng(position);
            }
          }

          existing.setTooltipContent(point.label);

          return;
        }

        const marker = L.marker(position, { icon: L.divIcon(options) })
          .addTo(leafletMap)
          .bindTooltip(point.label, {
            direction: "top",
            offset: [0, point.kind === "rider" ? -18 : -12],
          });

        if (point.kind === "rider") rememberIcon(marker, options.html);

        markers.current.set(key, marker);
      });

      for (const [key, marker] of markers.current) {
        if (!seen.has(key)) {
          marker.remove();
          markers.current.delete(key);
        }
      }

      // The dashed route follows the rider. Redrawn when the glide finishes, so
      // the line does not race ahead of the bike.
      const route = points.map((point) => [point.lat, point.lng] as [number, number]);

      if (lineTimer.current) clearTimeout(lineTimer.current);

      if (points.length > 1) {
        if (!line.current) {
          line.current = L.polyline(route, { color: "#898781", weight: 2, dashArray: "6 6" }).addTo(
            leafletMap,
          );
        } else {
          lineTimer.current = setTimeout(() => line.current?.setLatLngs(route), glideMs);
        }
      } else {
        line.current?.remove();
        line.current = null;
      }

      // Fitted once, and again only when a point appears or goes away -
      // refitting on every position would yank the view away from an admin who
      // had panned or zoomed deliberately.
      const layout = [...seen].sort().join("|");

      if (layout !== fittedFor.current) {
        fittedFor.current = layout;

        if (points.length === 1) {
          leafletMap.setView(route[0], 14);
        } else if (points.length > 1) {
          leafletMap.fitBounds(L.latLngBounds(route), { padding: [40, 40], maxZoom: 15 });
        }
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
    const markerMap = markers.current;

    return () => {
      if (lineTimer.current) clearTimeout(lineTimer.current);
      map.current?.remove();
      map.current = null;
      markerMap.clear();
      line.current = null;
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
