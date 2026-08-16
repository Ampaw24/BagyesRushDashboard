/**
 * Shown while a dashboard page awaits the API. Every list page fetches on the
 * server, so without this a filter change would leave the old page on screen
 * with no sign that anything is happening.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="flex flex-col gap-2">
        <div className="h-7 w-56 max-w-full animate-pulse rounded-md bg-surface-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-surface-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        ))}
      </div>

      <div className="h-96 animate-pulse rounded-xl border border-border-subtle bg-surface" />
    </div>
  );
}
