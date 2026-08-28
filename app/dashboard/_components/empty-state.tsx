import type { ReactNode } from "react";

/** The "nothing here" panel every list falls back to, so the wording is consistent. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
      <p className="break-words text-sm font-medium text-foreground">{title}</p>
      <p className="break-words text-sm text-text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Shown in place of a list the signed-in admin's role cannot read. The nav
 * already hides most of these, but a bookmarked URL can still land here.
 */
export function NoPermissionState({ what }: { what: string }) {
  return (
    <EmptyState
      title="You do not have access to this"
      description={`Your role does not include permission to view ${what}. Ask a super administrator if you need it.`}
    />
  );
}

/**
 * The API this screen needs is not on the connected backend.
 *
 * The dashboard and the API deploy separately, so a screen can be ahead of the
 * server it is talking to. Saying that plainly beats "Something went wrong",
 * which sends somebody looking for a bug that is really a pending deploy.
 */
export function NotDeployedState({ what }: { what: string }) {
  return (
    <EmptyState
      title="Not available on this backend yet"
      description={`${what} needs a newer version of the API than the one this dashboard is connected to. Deploy the backend and run its migrations, then reload.`}
    />
  );
}
