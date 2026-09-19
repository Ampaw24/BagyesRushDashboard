import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { apiUrl } from "@/lib/api/config";
import { getSessionToken } from "@/lib/auth/session";

/**
 * Runs an export on the admin's behalf and pipes the result back.
 *
 * The file has to arrive as a browser download, which means the request cannot
 * be a Server Action — and it cannot go straight to the API either, because the
 * bearer token lives in an httpOnly cookie the browser cannot read. So it comes
 * through here, where the server attaches it.
 *
 * Downloads stream back as bytes; email and WhatsApp come back as JSON, and are
 * passed through untouched so the caller can show the message or open the share
 * link. The backend still enforces the per-module permission — this proxy adds
 * no access of its own, and a 403 is returned verbatim.
 */
export async function POST(request: NextRequest) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const resource = params.get("resource");

  if (!resource) {
    return NextResponse.json({ message: "Nothing was named to export." }, { status: 400 });
  }

  // Everything except `resource` is the list screen's own filters plus the
  // format and channel, forwarded as-is so the export matches what is on screen.
  const forwarded = new URLSearchParams(params);
  forwarded.delete("resource");

  const upstream = await fetch(apiUrl(`/admin/exports/${resource}?${forwarded.toString()}`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const contentType = upstream.headers.get("content-type") ?? "";

  // Email and WhatsApp answer with the usual JSON envelope.
  if (contentType.includes("application/json")) {
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
    });
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      // Carried through so the browser names the file what the backend called
      // it rather than "route.ts".
      "Content-Disposition": upstream.headers.get("content-disposition") ?? `attachment; filename="${resource}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
