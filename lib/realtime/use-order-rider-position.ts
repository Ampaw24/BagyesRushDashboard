"use client";

import { useEffect, useState } from "react";

import type { RiderLocationEvent } from "../types/api";
import { getEcho } from "./echo";

export type LiveRiderPosition = {
  latitude: number;
  longitude: number;
  heading: number | null;
  /** When the rider's phone recorded it - used to ignore anything older. */
  recordedAt: Date | null;
};

/**
 * The rider's position on one order, live from the websocket.
 *
 * The server sends each fix to `order.{id}` for every order the rider is
 * carrying, and anyone who can open the order (orders.view) may listen. The
 * order page used to re-read the whole order every 20 seconds instead, so the
 * rider moved once every 20 seconds however smoothly the marker was drawn.
 *
 * Only subscribed while `enabled` - the map is collapsed by default, and a
 * socket subscription for a panel nobody opened is a cost for nothing. Null
 * until the first fix arrives, or when Reverb is not configured.
 */
export function useOrderRiderPosition(orderId: number, enabled: boolean): LiveRiderPosition | null {
  const [position, setPosition] = useState<LiveRiderPosition | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const echo = getEcho();
    if (!echo) return;

    const name = `order.${orderId}`;
    const channel = echo.private(name);

    channel.listen(".rider.location", (event: RiderLocationEvent) => {
      setPosition({
        latitude: event.latitude,
        longitude: event.longitude,
        heading: event.heading,
        recordedAt: event.recorded_at ? new Date(event.recorded_at) : null,
      });
    });

    return () => {
      // Leave the channel but keep the shared socket for everything else.
      echo.leave(name);
    };
  }, [orderId, enabled]);

  return enabled ? position : null;
}
