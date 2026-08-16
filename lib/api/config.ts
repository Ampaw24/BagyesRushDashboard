/**
 * Connection details for the Laravel backend (bagyes-rush-backend).
 *
 * API_BASE_URL is deliberately NOT prefixed with NEXT_PUBLIC_: every request is
 * made from the server (RSC or Server Action) with a bearer token read from an
 * httpOnly cookie, so neither the URL nor the token is ever shipped to the browser.
 */
export const API_BASE_URL = (process.env.API_BASE_URL ?? "http://31.187.74.65:8085").replace(/\/+$/, "");

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
