/**
 * Connection details for the Laravel backend (bagyes-rush-backend).
 *
 * API_BASE_URL is deliberately NOT prefixed with NEXT_PUBLIC_: every request is
 * made from the server (RSC or Server Action) with a bearer token read from an
 * httpOnly cookie, so neither the URL nor the token is ever shipped to the browser.
 */
export const API_BASE_URL = (process.env.API_BASE_URL ?? "https://api.bagyesrushdelivery.com").replace(/\/+$/, "");

/** Every route in routes/api.php lives under `Route::prefix('v1')` behind the `api` prefix. */
export const API_PREFIX = "/api/v1";

/** Name of the httpOnly cookie holding the Sanctum personal access token. */
export const SESSION_COOKIE = "bagyes_admin_token";

/**
 * The backend clamps `per_page` to 1..100 (see the ListRequest classes).
 * Asking for more is a 422, so the client clamps before sending.
 */
export const MIN_PER_PAGE = 1;
export const MAX_PER_PAGE = 100;
export const DEFAULT_PER_PAGE = 15;

export function apiUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${API_PREFIX}${suffix}`;
}

/**
 * Reverb connection details for the live rider map.
 *
 * These four ARE NEXT_PUBLIC_, and unlike API_BASE_URL that is correct: the
 * websocket is opened by the browser, and the app key is public by design in
 * the Pusher protocol — it identifies the application, it does not authorise
 * anything. The app *secret* stays on the Laravel server and never appears
 * here, and every private channel is still authorised one at a time.
 *
 * The Sanctum token is the part that must not reach the browser, which is why
 * Echo authorises through /api/broadcasting/auth on this app rather than
 * talking to Laravel directly — see app/api/broadcasting/auth/route.ts.
 */
export const REVERB = {
  key: process.env.NEXT_PUBLIC_REVERB_KEY ?? "",
  host: process.env.NEXT_PUBLIC_REVERB_HOST ?? "",
  port: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8090),
  scheme: process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http",
} as const;

/** Where Echo posts to prove it may join a private channel. Same-origin. */
export const BROADCAST_AUTH_ENDPOINT = "/api/broadcasting/auth";

/**
 * Whether the live map can connect at all.
 *
 * Checked rather than assumed so a deployment that has not configured Reverb
 * shows "live updates unavailable" instead of a map that silently never moves.
 */
export const REALTIME_CONFIGURED = REVERB.key !== "" && REVERB.host !== "";
