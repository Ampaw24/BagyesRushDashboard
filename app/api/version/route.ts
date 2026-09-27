import { NextResponse } from "next/server";

/**
 * Which build this server is serving.
 *
 * An open tab polls this to find out whether it is running code that has since
 * been replaced. The value is read from the environment at *request* time, not
 * inlined at build time, which is what makes the comparison work: after a deploy
 * an old tab asks the new server and gets the new answer.
 *
 * Deliberately unauthenticated. It states one opaque build identifier and nothing
 * about the account or the data — and it has to answer for a tab whose session
 * has expired, which is exactly a tab that has been open long enough to be stale.
 *
 * `force-dynamic` plus `no-store` because a cached answer is worse than none: a
 * proxy holding the old build id would tell every tab it is current for as long
 * as the entry lived.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { build_id: process.env.BUILD_ID ?? "dev" },
    { headers: { "cache-control": "no-store, max-age=0" } },
  );
}
