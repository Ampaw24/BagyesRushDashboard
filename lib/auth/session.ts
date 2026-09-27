import { cookies, headers } from "next/headers";

import { SESSION_COOKIE } from "../api/config";

/**
 * The Sanctum token lives in an httpOnly cookie so it is never readable from
 * client JavaScript. Only the server ever attaches it to a request.
 *
 * Importing `next/headers` is what keeps this module server-side: pulling it
 * into a Client Component is a build error, so the token cannot leak.
 *
 * A staff token *does* expire — `config/sanctum.php` leaves the global
 * `expiration` null but sets `admin_expiration` to 12 hours, or
 * `admin_remember_expiration` to 5 days when "remember me" was ticked. So the
 * cookie is sized from the token's own `expires_at` rather than from a number
 * chosen here: a cookie that outlives its token means the browser keeps
 * presenting something dead, and the admin is bounced to /login?expired=1 with
 * no explanation. That was the bug — a 30-day cookie over a 12-hour token.
 */

/**
 * Used only when the API did not say when the token expires, which for a staff
 * account it now always does. Matches `ADMIN_REMEMBER_MINUTES` so a fallback is
 * never *longer* than the token behind it.
 */
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

/**
 * Whether to mark the cookie `Secure`.
 *
 * This follows the actual request protocol, not `NODE_ENV`. Keying it off the
 * build mode meant a production build served over plain HTTP set `Secure`, and
 * browsers reject a `Secure` cookie from a non-HTTPS origin — so the cookie was
 * silently never stored. Login still appeared to work, because the redirect
 * after `cookies().set()` renders the next page in the same server roundtrip
 * and reads the cookie from the outgoing store; the following navigation then
 * arrived with nothing and the proxy bounced it back to /login.
 *
 * Set SESSION_COOKIE_SECURE=true|false to force it when TLS terminates
 * somewhere that does not forward the protocol header.
 */
async function shouldUseSecureCookie(): Promise<boolean> {
  const override = process.env.SESSION_COOKIE_SECURE;
  if (override === "true") return true;
  if (override === "false") return false;

  // A proxy may send a comma-separated chain; the first hop is the client's.
  const forwarded = (await headers()).get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim() === "https";

  return false;
}

/** Readable anywhere on the server, including Server Components. */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Writable only from a Server Action or Route Handler — HTTP cannot set a
 * cookie once a Server Component has begun streaming.
 */
export async function setSessionToken(
  token: string,
  remember: boolean,
  expiresAt?: string | null,
): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await shouldUseSecureCookie(),
    path: "/",
    // Without `maxAge` the cookie is dropped when the browser closes, which is
    // what an admin who did not tick "remember me" should get.
    ...(remember ? { maxAge: rememberMaxAge(expiresAt) } : {}),
  });
}

/**
 * How long to keep the cookie, in seconds: exactly as long as the token behind
 * it lives, never longer.
 *
 * A past or unparseable date falls back to the constant rather than to zero — a
 * `maxAge` of 0 deletes the cookie outright, which would turn a clock skew of a
 * few seconds into "signing in does nothing".
 */
function rememberMaxAge(expiresAt?: string | null): number {
  if (!expiresAt) return REMEMBER_MAX_AGE;

  const seconds = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);

  return Number.isFinite(seconds) && seconds > 0 ? seconds : REMEMBER_MAX_AGE;
}

/** Also only valid from a Server Action or Route Handler. */
export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
