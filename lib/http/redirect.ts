import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirect to a path on this site, without naming the host.
 *
 * `new URL("/login", request.url)` looks right and is wrong in deployment.
 * `request.url` is the URL as the Node server received it, which behind a
 * reverse proxy — or bound to `0.0.0.0` — is the *bind* address, not the
 * address the browser used. The redirect then comes back as
 * `https://0.0.0.0:3000/login`, and the browser follows it to nowhere. Logging
 * out was the visible symptom; every guarded route had the same bug.
 *
 * A relative `Location` is legal (RFC 7231 §7.1.2 has allowed it since 2014)
 * and every browser resolves it against the current page, so the question of
 * which host we are on never has to be answered. That is the whole fix: no
 * trusted-host list, no `X-Forwarded-Host` parsing, nothing to misconfigure.
 *
 * @param path An absolute path on this site, e.g. `/login?expired=1`.
 */
export function redirectTo(path: string, status: 302 | 303 | 307 | 308 = 307): NextResponse {
  // Guard against an open redirect: a `path` that starts with `//` or names a
  // scheme would send the browser off-site. Callers pass literals today, but
  // this is the function everything redirects through and it should not be
  // able to become the hole.
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/";

  return new NextResponse(null, {
    status,
    headers: { Location: safe },
  });
}

/**
 * The same redirect, for middleware, which cannot take a relative one.
 *
 * Next parses the `Location` of a response returned from `proxy.ts` and throws
 * `TypeError: Invalid URL` on a relative path, so this is the one place an
 * absolute URL has to be built — and therefore the one place the host has to be
 * worked out.
 *
 * In order of trust:
 *
 * 1. `APP_ORIGIN`, when set. The same idea as Laravel's `APP_URL`: the operator
 *    states the public origin once and nothing has to be inferred. Set it and
 *    none of the guesswork below runs.
 * 2. `X-Forwarded-Host` / `X-Forwarded-Proto`, which is what a reverse proxy
 *    sends and what the `Host` header loses.
 * 3. The `Host` header.
 *
 * Only ever used to redirect to a path on this site, but the host still decides
 * where the browser goes — so a spoofed `X-Forwarded-Host` is an open redirect.
 * That is exactly why `APP_ORIGIN` is first and worth setting in production.
 */
export function redirectToAbsolute(
  request: NextRequest,
  path: string,
  status: 302 | 303 | 307 | 308 = 307,
): NextResponse {
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/";

  return NextResponse.redirect(new URL(safe, publicOrigin(request)), status);
}

function publicOrigin(request: NextRequest): string {
  const configured = process.env.APP_ORIGIN?.trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  // A proxy chain sends a comma-separated list; the first entry is the client's.
  const first = (value: string | null) => value?.split(",")[0]?.trim() || null;

  const host =
    first(request.headers.get("x-forwarded-host")) ?? first(request.headers.get("host"));

  if (!host) {
    // Nothing said where we are. nextUrl is derived from the request and is the
    // last thing left to go on.
    return request.nextUrl.origin;
  }

  const proto =
    first(request.headers.get("x-forwarded-proto")) ??
    request.nextUrl.protocol.replace(":", "");

  return `${proto}://${host}`;
}
