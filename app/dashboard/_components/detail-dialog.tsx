"use client";

import { useEffect } from "react";

/**
 * The shell every "look at this person without leaving the list" dialog uses.
 *
 * Reviewing riders and vendors is a queue: an admin works down a page deciding
 * who to approve, and a full page navigation per row means losing the scroll
 * position and the filters on the way back. The dialog is the quick look; the
 * full profile is still one click away for the things that do not belong in a
 * modal (the map, the wallet ledger, the audit trail).
 *
 * Escape closes it and the page behind does not scroll while it is open — the
 * same two rules `ImageLightbox` already follows, kept here so a dialog that
 * opens a lightbox inside itself behaves consistently at both depths.
 */
export function DetailDialog({
  label,
  onClose,
  header,
  footer,
  children,
  /** Wider than the customer dialog by default: riders carry far more fields. */
  className = "max-w-3xl",
}: {
  /** Accessible name — "View rider", not the person's name. */
  label: string;
  onClose: () => void;
  header: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`relative flex max-h-[90vh] w-full flex-col rounded-xl border border-border-subtle bg-surface shadow-sm ${className}`}
      >
        {/* The header stays put while the body scrolls: which person you are
            looking at should not scroll off the top of a long profile. */}
        <div className="shrink-0 border-b border-border-subtle p-6 pb-4">{header}</div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">{children}</div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border-subtle p-6 pt-4">
          {footer}
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** A label above its value. The dialogs lay these out in a responsive grid. */
export function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="break-words text-sm font-medium text-foreground">{value ?? "—"}</dd>
    </div>
  );
}

/** A titled group of fields. */
export function DetailSection({
  title,
  children,
  columns = 2,
}: {
  title: string;
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}) {
  const grid =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-2 sm:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-muted/40 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <dl className={`grid gap-3 ${grid}`}>{children}</dl>
    </section>
  );
}

/** The tab strip inside a dialog — flatter than the page-level `Tabs`. */
export function DialogTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1 border-b border-border-subtle">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={tab.key === active}
          onClick={() => onChange(tab.key)}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition duration-150 ${
            tab.key === active
              ? "border-brand text-foreground"
              : "border-transparent text-text-secondary hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
