import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/api/config";

/**
 * Route protection. In Next.js 16 this file is `proxy.ts`, not `middleware.ts`.
 *
 * This is an optimistic check only — it asks whether a session cookie exists,
 * not whether the token is still valid. Real authorisation happens in the API
 * on every request, and a revoked token produces a 401 that the API client
 * turns into a /logout redirect.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (pathname.startsWith("/dashboard") && !hasSession) {
    const target = new URL("/login", request.url);
    // Remember where they were headed so login can return them there.
    if (pathname !== "/dashboard") target.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(target);
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, the logout handler (which must run to
  // clear the cookie), and static assets.
  matcher: ["/((?!api|logout|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|svg|webp|ico)$).*)"],
};
