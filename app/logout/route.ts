import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/api/config";
import { redirectTo } from "@/lib/http/redirect";

/**
 * Clears the session cookie and returns to the login screen.
 *
 * This exists as a Route Handler because a Server Component cannot set or
 * delete cookies — HTTP has already started streaming by then. Any 401 from
 * the API redirects here, as does the profile menu's sign-out.
 */
export async function GET(request: NextRequest) {
  const reason = request.nextUrl.searchParams.get("reason");

  // 303, so the browser follows with GET whatever method got here.
  const response = redirectTo(reason === "expired" ? "/login?expired=1" : "/login", 303);
  response.cookies.delete(SESSION_COOKIE);

  return response;
}
