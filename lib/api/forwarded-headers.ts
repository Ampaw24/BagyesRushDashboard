import { headers } from "next/headers";

/**
 * Carry the admin's own address and browser through to the API.
 *
 * This dashboard calls Laravel from the *server* — every list, every action —
 * because the Sanctum token lives in an httpOnly cookie that only the server can
 * read. That is the right trade for the token, and it has one consequence nobody
 * spots until they read an audit log: as far as Laravel is concerned the caller
 * is this Node process. Every row in the activity log, every sign-in event and
 * every entry on the sessions screen recorded the dashboard server's IP and a
 * `node`-shaped user agent, for all admins, forever.
 *
 * So the real values are forwarded explicitly. `x-forwarded-for` is passed
 * through as a *chain* rather than as a single address: Laravel resolves the
 * client from the leftmost hop it does not trust, and rewriting the chain here
 * would throw away the information it needs to do that.
 *
 * The API only honours these once the dashboard host is named in its
 * TRUSTED_PROXIES — otherwise anybody could post an X-Forwarded-For of their
 * choosing straight at the API and write fiction into the audit trail.
 */
export async function forwardedClientHeaders(): Promise<Record<string, string>> {
  const forwarded: Record<string, string> = {};

  try {
    const incoming = await headers();

    // The chain as it reached us, plus whatever single-address header the proxy
    // set. Falling back to x-real-ip covers an nginx that sets only that.
    const chain = incoming.get("x-forwarded-for") ?? incoming.get("x-real-ip");
    if (chain) forwarded["X-Forwarded-For"] = chain;

    // Deliberately NOT X-Forwarded-Proto. It describes the scheme this dashboard
    // was reached on, and Laravel would take it as the scheme *it* was reached on
    // and generate its own absolute URLs from it — so a dashboard on https in
    // front of an API on plain http would have the API writing https links to
    // itself. The audit trail needs the address and the browser, not the scheme.

    // Without this the sessions screen lists every admin as whatever Node calls
    // itself, which tells somebody checking their own sessions nothing at all.
    const agent = incoming.get("user-agent");
    if (agent) forwarded["User-Agent"] = agent;
  } catch {
    // No request context — a build-time render, or a call from somewhere with no
    // incoming request. Forwarding nothing is correct: there is no client to
    // describe, and inventing one would be worse than the server's own address.
  }

  return forwarded;
}
