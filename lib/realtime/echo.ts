"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

import { BROADCAST_AUTH_ENDPOINT, REALTIME_CONFIGURED, REVERB } from "../api/config";

type EchoClient = Echo<"reverb">;

let client: EchoClient | null = null;

/**
 * The dashboard's single websocket connection.
 *
 * A singleton because a connection is expensive and shared: two components
 * watching rider positions should be two subscriptions on one socket, not two
 * sockets. Next's fast refresh also remounts components freely in development,
 * and a per-component client would leak one connection per edit.
 *
 * Returns null when Reverb is not configured, so a deployment without it
 * degrades to "no live updates" rather than throwing on every page that
 * imports this.
 */
export function getEcho(): EchoClient | null {
  if (!REALTIME_CONFIGURED) return null;
  if (client) return client;

  // Echo expects Pusher on the window. Reverb speaks the Pusher protocol, which
  // is why the browser client here is the ordinary pusher-js.
  (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

  client = new Echo({
    broadcaster: "reverb",
    key: REVERB.key,
    wsHost: REVERB.host,
    wsPort: REVERB.port,
    wssPort: REVERB.port,
    forceTLS: REVERB.scheme === "https",
    enabledTransports: ["ws", "wss"],

    // Authorised through this app rather than straight to Laravel: the Sanctum
    // token is in an httpOnly cookie the browser cannot read, so the request
    // has to pass through a server that can. See app/api/broadcasting/auth.
    authEndpoint: BROADCAST_AUTH_ENDPOINT,
  });

  return client;
}

/**
 * Drop the connection.
 *
 * Only worth calling on logout. Individual components leave their channels
 * instead — see `useRiderPositions` — because tearing down the socket would
 * disconnect every other listener on the page.
 */
export function disconnectEcho(): void {
  client?.disconnect();
  client = null;
}
