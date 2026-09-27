/**
 * Which build the open tab is running, and which one the server is serving.
 *
 * Both come from the one `BUILD_ID` the deploy sets. The difference is *when*
 * each is read:
 *
 * - `CLIENT_BUILD_ID` is inlined into the bundle at build time, so it is frozen
 *   at whatever the tab downloaded.
 * - `fetchServerBuildId()` asks `/api/version`, which reads the variable at
 *   request time — and after a deploy that request is answered by the *new*
 *   server.
 *
 * So a mismatch means exactly one thing: this tab is running code the server has
 * replaced. That is the moment to offer an update, rather than waiting for a
 * missing chunk to crash the page.
 *
 * With `BUILD_ID` unset both sides read `dev` and nothing ever mismatches, which
 * is the right failure mode: no banner rather than a banner that never goes away.
 */

/** The build this bundle was compiled from. Inlined, so it never changes. */
export const CLIENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

/** Where the running server states its own build. Same-origin, never cached. */
export const VERSION_ENDPOINT = "/api/version";

export type ServerVersion = { build_id: string };

/**
 * Ask the server which build it is running.
 *
 * Returns null on any failure — offline, a 502 mid-deploy, a body that is not
 * what we expect. A failed check must never be read as "a new version exists":
 * the dashboard is most likely to be unreachable *during* a deploy, and popping
 * an update banner off a network error would show it to people whose tab is
 * perfectly current.
 */
export async function fetchServerBuildId(signal?: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(VERSION_ENDPOINT, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal,
    });

    if (!response.ok) return null;

    const body: unknown = await response.json();
    const buildId = (body as Partial<ServerVersion> | null)?.build_id;

    return typeof buildId === "string" && buildId !== "" ? buildId : null;
  } catch {
    return null;
  }
}

/**
 * Whether the server is serving a different build than this tab is running.
 *
 * `serverBuildId` being null (a failed check) is never a mismatch, and neither is
 * an unconfigured deploy where both sides read the fallback.
 */
export function isOutdated(serverBuildId: string | null): boolean {
  if (serverBuildId === null) return false;
  if (CLIENT_BUILD_ID === "dev" || serverBuildId === "dev") return false;

  return serverBuildId !== CLIENT_BUILD_ID;
}
