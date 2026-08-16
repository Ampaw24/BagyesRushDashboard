import { cookies } from "next/headers";

import { SESSION_COOKIE } from "../api/config";

/**
 * The Sanctum token lives in an httpOnly cookie so it is never readable from
 * client JavaScript. Only the server ever attaches it to a request.
 *
 * Importing `next/headers` is what keeps this module server-side: pulling it
 * into a Client Component is a build error, so the token cannot leak.
 *
 * `config/sanctum.php` sets `expiration = null`, so the token itself never
 * expires; the cookie lifetime below is purely a client-side session policy.
 */
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Readable anywhere on the server, including Server Components. */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Writable only from a Server Action or Route Handler — HTTP cannot set a
 * cookie once a Server Component has begun streaming.
 */
export async function setSessionToken(token: string, remember: boolean): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Without `maxAge` the cookie is dropped when the browser closes, which is
    // what an admin who did not tick "remember me" should get.
    ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
  });
}

/** Also only valid from a Server Action or Route Handler. */
export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
