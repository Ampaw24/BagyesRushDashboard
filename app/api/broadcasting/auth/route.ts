import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { API_BASE_URL } from "@/lib/api/config";
import { getSessionToken } from "@/lib/auth/session";

/**
 * Authorises a websocket channel subscription on the browser's behalf.
 *
 * Echo runs in the browser and has to prove the viewer may join a private
 * channel. Laravel's `/broadcasting/auth` wants the Sanctum bearer token to do
 * that — and that token deliberately lives in an httpOnly cookie the browser
 * cannot read, which is the whole point of how this dashboard authenticates.
 *
 * So the request comes here instead: same origin, cookie attached automatically,
 * token read server-side and forwarded upstream. The token itself never reaches
 * client JavaScript.
 *
 * This proxy grants nothing of its own. The channel closures in
 * `routes/channels.php` still decide, and a viewer without a stake in the
 * subject gets the API's 403 verbatim — which Echo surfaces as a failed
 * subscription rather than a silent empty channel.
 */
export async function POST(request: NextRequest) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  // Echo sends either form-encoded or JSON depending on how it is configured;
  // forwarding the raw body with its original content type covers both without
  // this handler needing to understand either.
  const body = await request.text();

  const upstream = await fetch(`${API_BASE_URL}/broadcasting/auth`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  const payload = await upstream.text();

  // Passed through verbatim, status included: the signed auth string Pusher
  // clients expect is generated upstream, and a 403 has to stay a 403 so Echo
  // stops retrying a channel this viewer will never be allowed to join.
  return new NextResponse(payload, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "private, no-store",
    },
  });
}
