"use client";

import { useEffect, useState, useTransition } from "react";

import { searchVendorsAction } from "./_actions";

type VendorOption = { id: number; name: string; city: string };

const FIELD =
  "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground outline-none transition duration-150 focus:border-brand";

/**
 * Choosing the vendor a code is scoped to, by name.
 *
 * This replaces a bare `<input type="number">` labelled "Vendor ID". Nobody
 * knows a vendor's numeric id, so the field was either copied from the URL of
 * another tab or guessed — and a typo silently scopes the discount to a
 * different kitchen, which surfaces days later as a customer insisting a valid
 * code does not work.
 *
 * Searching hits the server because the vendor directory is a table, not
 * something worth shipping to the browser. The chosen id rides along in a
 * hidden input so the surrounding plain `<form>` submits it unchanged.
 */
export function VendorPicker({
  name,
  defaultVendorId,
  defaultVendorName,
}: {
  name: string;
  defaultVendorId?: number | null;
  /** Shown before any search runs, so editing a code does not look empty. */
  defaultVendorName?: string | null;
}) {
  const [selected, setSelected] = useState<VendorOption | null>(
    defaultVendorId
      ? { id: defaultVendorId, name: defaultVendorName ?? `Vendor #${defaultVendorId}`, city: "" }
      : null,
  );
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<VendorOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Only while choosing. Once somebody has picked, searching again on every
    // keystroke would be work nobody asked for.
    if (selected) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;

      // Inside a transition: a Server Action that redirects — which apiFetch
      // does on an expired session — cannot be applied outside one.
      startTransition(async () => {
        setSearching(true);
        const result = await searchVendorsAction(term.trim());

        if (cancelled) return;
        setResults(result.ok ? result.data : []);
        setSearching(false);
      });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, selected]);

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={selected?.id ?? ""} />

      {selected ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-muted px-3 py-2.5">
          <span className="flex min-w-0 flex-col">
            <span className="break-words text-sm font-medium text-foreground">{selected.name}</span>
            {selected.city && <span className="text-xs text-text-muted">{selected.city}</span>}
          </span>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setTerm("");
            }}
            className="shrink-0 text-xs font-medium text-brand hover:underline"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search vendors by name, description or city"
            className={FIELD}
          />

          <div className="max-h-48 overflow-y-auto rounded-lg border border-border-subtle">
            {searching && results.length === 0 ? (
              <p className="p-3 text-sm text-text-muted">Searching…</p>
            ) : results.length === 0 ? (
              <p className="p-3 text-sm text-text-muted">No approved vendor matches that.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {results.map((vendor) => (
                  <li key={vendor.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(vendor)}
                      className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition duration-150 hover:bg-surface-muted"
                    >
                      <span className="text-sm text-foreground">{vendor.name}</span>
                      <span className="text-xs text-text-muted">{vendor.city}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
