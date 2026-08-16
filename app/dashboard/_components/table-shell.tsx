import type { ReactNode } from "react";

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-sm">
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
