"use client";

import { useEffect, useMemo, useState } from "react";

import { REALTIME_CONFIGURED } from "../api/config";
import type { RiderLiveDto, RiderLocationEvent } from "../types/api";
import { getEcho } from "./echo";

export type ConnectionState = "connecting" | "live" | "offline" | "unavailable";

/** How often the "last seen" ages are recomputed. */
const AGE_TICK_MS = 5_000;

/**
 * Every rider's position, kept current from the websocket.
 *
 * Seeded from `GET /admin/riders/live` on the server so the map has markers on
 * first paint, then updated from `rider.location` frames. Nothing is polled: a
 * dispatch map that refetched every few seconds would be both slower to update
 * and heavier on the API than the socket it is replacing.
 *
 * The seed and the live frames are merged at render rather than copied into one
 * another. That keeps the server's list authoritative for everything a frame
 * does not carry — phone, rating, what the rider is carrying — and means a
 * navigation that re-fetches the seed does not have to be reconciled against
 * whatever the socket has done since.
 */
export function useRiderPositions(seed: RiderLiveDto[]) {
  const [events, setEvents] = useState<Map<number, RiderLocationEvent>>(() => new Map());
  const [connection, setConnection] = useState<ConnectionState>(
    REALTIME_CONFIGURED ? "connecting" : "unavailable",
  );

  // Ages are derived from a timestamp, so without a tick "12s ago" would sit
  // there saying 12s until the next position arrived - which is exactly the
  // case where a dispatcher needs to see the number climbing.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), AGE_TICK_MS);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const echo = getEcho();

    // `connection` already starts at "unavailable" when Reverb is unconfigured,
    // so there is nothing to set here.
    if (!echo) return;

    const channel = echo.private("admin.riders");

    channel.listen(".rider.location", (event: RiderLocationEvent) => {
      setEvents((current) => {
        const next = new Map(current);
        next.set(event.rider_id, event);

        return next;
      });
    });

    // Pusher-protocol connection states, surfaced so the page can say "live" or
    // "reconnecting" rather than leaving a stalled map looking healthy - a
    // dropped socket and a city where nobody is riding look identical
    // otherwise.
    const connector = echo.connector as unknown as {
      pusher?: { connection?: { bind: (event: string, callback: () => void) => void } };
    };
    const socket = connector.pusher?.connection;

    socket?.bind("connected", () => setConnection("live"));
    socket?.bind("connecting", () => setConnection("connecting"));
    socket?.bind("unavailable", () => setConnection("offline"));
    socket?.bind("disconnected", () => setConnection("offline"));
    socket?.bind("failed", () => setConnection("offline"));

    return () => {
      // Leave the channel, but do not disconnect the socket: it is shared with
      // anything else on the page that is listening.
      echo.leave("admin.riders");
    };
  }, []);

  const riders = useMemo(() => {
    void tick; // re-derive the ages on each tick

    const merged = new Map(seed.map((rider) => [rider.rider_id, rider]));

    for (const [riderId, event] of events) {
      merged.set(riderId, applyEvent(merged.get(riderId), event));
    }

    return [...merged.values()]
      .map(withCurrentAge)
      .sort((a, b) => {
        // Busy riders first - this is a dispatch screen, so who is carrying
        // something matters more than who is nearest the top of the alphabet.
        if (a.active_order_count !== b.active_order_count) {
          return b.active_order_count - a.active_order_count;
        }

        return a.name.localeCompare(b.name);
      });
  }, [seed, events, tick]);

  return { riders, connection };
}

/**
 * A frame laid over whatever the server last said about this rider.
 *
 * `base` is missing only for somebody who came online after the page was
 * seeded, which is why the event carries enough identity to stand alone.
 */
function applyEvent(base: RiderLiveDto | undefined, event: RiderLocationEvent): RiderLiveDto {
  return {
    ...(base ?? blankRider(event)),
    rider_id: event.rider_id,
    user_id: event.user_id,
    name: event.name,
    photo_url: event.photo_url,
    vehicle_type: event.vehicle_type,
    plate_number: event.plate_number,
    latitude: event.latitude,
    longitude: event.longitude,
    heading: event.heading,
    speed_kph: event.speed_kph,
    accuracy_m: event.accuracy_m,
    is_online: event.is_online,
    recorded_at: event.recorded_at,
    active_order_count: event.active_order_ids.length,
    // The frame carries order ids but no order detail. Keeping the seeded
    // detail when the set is unchanged avoids blanking the panel on every
    // position update; when it has genuinely changed, the count is honest and
    // the detail fills back in on the next load.
    active_orders:
      base && sameOrders(base, event.active_order_ids) ? base.active_orders : [],
  };
}

/**
 * Recompute how old the fix is from its timestamp.
 *
 * The server's `location_age_seconds` was true when it was serialised; a socket
 * frame does not carry one at all. Deriving it here means one rule for both.
 */
function withCurrentAge(rider: RiderLiveDto): RiderLiveDto {
  if (!rider.recorded_at) {
    return { ...rider, location_age_seconds: null, is_stale: true };
  }

  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(rider.recorded_at)) / 1000));

  return {
    ...rider,
    location_age_seconds: seconds,
    // Kept in step with the backend's own staleness window; a marker that stops
    // reporting greys out rather than implying the rider is still there.
    is_stale: seconds > 600,
  };
}

function sameOrders(rider: RiderLiveDto, ids: number[]): boolean {
  if (rider.active_orders.length !== ids.length) return false;

  return rider.active_orders.every((order) => ids.includes(order.id));
}

/**
 * A marker for a rider who came online after the page was seeded. Only the
 * fields a frame cannot supply are filled in, each conservatively.
 */
function blankRider(event: RiderLocationEvent): RiderLiveDto {
  return {
    rider_id: event.rider_id,
    user_id: event.user_id,
    name: event.name,
    photo_url: event.photo_url,
    phone: null,
    vehicle_type: event.vehicle_type,
    vehicle_type_label: null,
    plate_number: event.plate_number,
    latitude: event.latitude,
    longitude: event.longitude,
    heading: event.heading,
    speed_kph: event.speed_kph,
    accuracy_m: event.accuracy_m,
    recorded_at: event.recorded_at,
    location_age_seconds: 0,
    is_stale: false,
    is_online: event.is_online,
    status: "approved",
    rating: 0,
    deliveries_completed: 0,
    active_orders: [],
    active_order_count: event.active_order_ids.length,
  };
}
