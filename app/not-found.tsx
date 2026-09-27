import Link from "next/link";

/**
 * A 404 that says where to go next.
 *
 * There was no root `not-found.tsx`, so an unknown URL — or a client-side
 * navigation to a route a deploy had just removed — rendered Next's bare
 * built-in page. That is what somebody reported as "page not found" after
 * logging in: nothing identifies it as this application, so it reads as the
 * whole site being broken rather than one bad link.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-6">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-text-muted">404</span>

        <h1 className="text-lg font-semibold text-foreground">This page does not exist</h1>

        <p className="text-sm leading-relaxed text-text-secondary">
          The link may be out of date, or the page may have moved. If you reached this straight
          after signing in, reloading usually resolves it — a new version of the dashboard may have
          been deployed while your tab was open.
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            Go to dashboard
          </Link>
          <Link
            href="/login"
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
