import type { ReactNode } from "react";

export function TableShell({ children }: { children: ReactNode }) {
  return (
    // `w-full min-w-0` so the scroll container measures itself against the
    // column it sits in rather than against its own content - without it the
    // wrapper grows to the table's width and there is nothing left to scroll.
    <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-sm">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function TableHeadCell({ children }: { children: ReactNode }) {
  return (
    <th className="border-b border-border-subtle bg-surface-muted px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-muted">
      {children}
    </th>
  );
}

export function TableCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border-b border-border-subtle px-4 py-3.5 align-middle text-foreground ${className}`}>{children}</td>;
}
