"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

import { useRiderPositions, type ConnectionState } from "@/lib/realtime/use-rider-positions";
import type { RiderLiveDto } from "@/lib/types/api";

import { RiderDetailPanel } from "./rider-detail-panel";
import { RiderMapFilters, type MapFilter } from "./rider-map-filters";
import { ACCRA, glide, riderIconOptions, riderTooltip } from "../../_components/rider-marker";

/**
 * Every rider on one map, moving.
 *
 * Seeded from the server so there are markers before the socket connects, then
 * driven entirely by `rider.location` frames — nothing here polls.
 *
 * Leaflet against OpenStreetMap tiles, matching the order tracking map: no API
 * key, no per-load billing. Imported dynamically inside an effect because
 * Leaflet reaches for `window` at module scope and throws during server
 * rendering.
 */
export function RiderMap({ seed }: { seed: RiderLiveDto[] }) {
  const { riders, connection } = useRiderPositions(seed);

  const [filter, setFilter] = useState<MapFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<Map<number, Marker>>(new Map());
  const hasFitted = useRef(false);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return riders.filter((rider) => {
      if (rider.latitude === null || rider.longitude === null) return false;

      if (filter === "busy" && rider.active_order_count === 0) return false;
      if (filter === "idle" && rider.active_order_count > 0) return false;
      if (filter === "stale" && !rider.is_stale) return false;

      if (term === "") return true;

      return (
        rider.name.toLowerCase().includes(term) ||
        (rider.plate_number ?? "").toLowerCase().includes(term)
      );
    });
  }, [riders, filter, search]);

  const selected = useMemo(
    () => visible.find((rider) => rider.rider_id === selectedId) ?? null,
    [visible, selectedId],
  );

  // Create the map once.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !container.current || map.current) return;

      map.current = L.map(container.current, { attributionControl: true }).setView(ACCRA, 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map.current);

      // Leaflet measures its container on creation; inside a panel that was
      // hidden a moment ago it measures zero and renders one grey tile.
      setTimeout(() => map.current?.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync markers with the current positions.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !map.current) return;

      const seen = new Set<number>();

      for (const rider of visible) {
        seen.add(rider.rider_id);

        const position: [number, number] = [rider.latitude!, rider.longitude!];
        const existing = markers.current.get(rider.rider_id);

        if (existing) {
          // Moved rather than replaced. Recreating the marker would restart the
          // CSS transition and make the bike blink instead of glide.
          existing.setLatLng(position);
          existing.setIcon(L.divIcon(riderIconOptions(rider)));
          existing.setTooltipContent(riderTooltip(rider));
          glide(existing);
          continue;
        }

        const marker = L.marker(position, { icon: L.divIcon(riderIconOptions(rider)) })
          .addTo(map.current)
          .bindTooltip(riderTooltip(rider), { direction: "top", offset: [0, -26] })
          .on("click", () => setSelectedId(rider.rider_id));

        glide(marker);

        markers.current.set(rider.rider_id, marker);
      }

      // Anyone filtered out, or who went offline.
      for (const [riderId, marker] of markers.current) {
        if (!seen.has(riderId)) {
          marker.remove();
          markers.current.delete(riderId);
        }
      }

      // Fit once, on the first paint that has anybody to fit around. Refitting
      // on every update would yank the view away from a dispatcher who had
      // panned somewhere deliberately.
      if (!hasFitted.current && visible.length > 0) {
        hasFitted.current = true;

        map.current.fitBounds(
          L.latLngBounds(visible.map((rider) => [rider.latitude!, rider.longitude!] as [number, number])),
          { padding: [48, 48], maxZoom: 14 },
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    // Captured here rather than read in the cleanup: by the time teardown runs
    // the ref may point at a different Map.
    const tracked = markers.current;

    return () => {
      map.current?.remove();
      map.current = null;
      tracked.clear();
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <RiderMapFilters
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
        counts={{
          all: riders.length,
          busy: riders.filter((rider) => rider.active_order_count > 0).length,
          idle: riders.filter((rider) => rider.active_order_count === 0).length,
          stale: riders.filter((rider) => rider.is_stale).length,
        }}
        connection={connection}
      />

      <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
        <div
          ref={container}
          className="h-[34rem] w-full overflow-hidden rounded-xl border border-border-subtle bg-surface-muted"
        />

        <RiderDetailPanel
          rider={selected}
          riders={visible}
          onSelect={(riderId) => {
            setSelectedId(riderId);

            const rider = visible.find((candidate) => candidate.rider_id === riderId);
            if (rider?.latitude != null && rider.longitude != null) {
              map.current?.setView([rider.latitude, rider.longitude], 15, { animate: true });
            }
          }}
          onClear={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}

export type { ConnectionState };
