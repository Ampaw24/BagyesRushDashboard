import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { apiUrl } from "@/lib/api/config";
import { getSessionToken } from "@/lib/auth/session";
import { RIDER_DOCUMENT_TYPES, type RiderDocumentType } from "@/lib/types/enums";

/**
 * Streams a rider's identity document through the dashboard.
 *
 * `GET /admin/riders/{id}/documents/{type}` returns a binary file off the
 * private disk and requires a bearer token. The browser cannot supply that
 * token — it lives in an httpOnly cookie — so an <a href> has to come through
 * here, where the server attaches it and pipes the response back.
 *
 * The backend still enforces `riders.documents`; this proxy adds no access of
 * its own, and a caller without the permission gets the API's 403 verbatim.
 */
export async function GET(request: NextRequest) {
  const riderId = Number(request.nextUrl.searchParams.get("riderId"));
  const type = request.nextUrl.searchParams.get("type");

  if (!Number.isInteger(riderId) || riderId <= 0) {
    return NextResponse.json({ message: "A valid riderId is required." }, { status: 400 });
  }

  if (!isDocumentType(type)) {
    return NextResponse.json({ message: "Unknown document type." }, { status: 400 });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.redirect(new URL("/login?expired=1", request.url));

  const upstream = await fetch(apiUrl(`/admin/riders/${riderId}/documents/${type}`), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    // Errors come back as the usual JSON envelope; pass the status through.
    return NextResponse.json(
      { message: "The document could not be retrieved." },
      { status: upstream.status },
    );
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      // `inline` so it previews in a tab rather than forcing a download.
      "Content-Disposition":
        upstream.headers.get("content-disposition") ?? `inline; filename="${type}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function isDocumentType(value: string | null): value is RiderDocumentType {
  return value !== null && (RIDER_DOCUMENT_TYPES as readonly string[]).includes(value);
}
