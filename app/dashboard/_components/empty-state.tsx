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
