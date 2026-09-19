"use client";

import { useEffect, useState, useTransition } from "react";

import { searchAudienceAction } from "../_actions";
import type { AudienceCandidateDto } from "@/lib/types/api";

const FIELD =
  "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground outline-none transition duration-150 focus:border-brand";

/**
 * Choosing who a broadcast goes to, by name.
 *
 * This replaces a textarea that took raw user ids — which nobody knows, and
 * which silently addressed the wrong person on a typo. Search hits the server
 * because the directory is the user table, not something worth shipping to the
 * browser.
 */
export function AudiencePicker({
  selected,
  onChange,
  /** Push-only sends cannot reach somebody with no device, so the picker says so. */
  warnWithoutDevice,
  /**
   * One person, not an audience.
   *
   * Picking replaces the selection rather than adding to it, and the footer
   * drops the broadcast wording. Push diagnostics sends to one person at a
   * time; the directory search is the valuable half and is worth having once
   * rather than twice.
   */
  single = false,
  label = "Find people",
  placeholder = "Search by name, phone or email",
}: {
  selected: AudienceCandidateDto[];
  onChange: (people: AudienceCandidateDto[]) => void;
  warnWithoutDevice: boolean;
  single?: boolean;
  label?: string;
  placeholder?: string;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<AudienceCandidateDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;

      // Inside a transition: a Server Action that redirects - which apiFetch
      // does on an expired session - cannot be applied by the client outside
      // one, and surfaces as an unexplained runtime error instead.
      startTransition(async () => {
        setSearching(true);
        const result = await searchAudienceAction({ q: term.trim() || undefined, limit: 20 });

        if (cancelled) return;
        setResults(result.ok ? result.data : []);
        setSearching(false);
      });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  const chosen = new Set(selected.map((person) => person.id));

  const add = (person: AudienceCandidateDto) => {
    if (chosen.has(person.id)) return;
    // Replace rather than append when only one person is wanted, so picking a
    // second silently swaps instead of quietly building a list.
    onChange(single ? [person] : [...selected, person]);
  };

  const remove = (id: number) => onChange(selected.filter((person) => person.id !== id));

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </span>
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={placeholder}
          className={FIELD}
        />
      </label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((person) => (
            <span
              key={person.id}
              className="inline-flex items-center gap-2 rounded-full bg-brand/10 py-1 pl-3 pr-1.5 text-xs text-brand"
            >
              {person.name}
              {warnWithoutDevice && !person.has_device && (
                <span className="text-status-warning" title="Has never opened the app">
                  no device
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(person.id)}
                aria-label={`Remove ${person.name}`}
                className="flex h-5 w-5 items-center justify-center rounded-full transition duration-150 hover:bg-brand/20"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="max-h-56 overflow-y-auto rounded-lg border border-border-subtle">
        {searching && results.length === 0 ? (
          <p className="p-3 text-sm text-text-muted">Searching…</p>
        ) : results.length === 0 ? (
          <p className="p-3 text-sm text-text-muted">Nobody matches that.</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {results.map((person) => {
              const already = chosen.has(person.id);

              return (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => add(person)}
                    disabled={already}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm text-foreground">{person.name}</span>
                      <span className="text-xs text-text-muted">
                        {person.phone ?? person.email} · {person.role}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">
                      {already
                        ? single
                          ? "Selected"
                          : "Added"
                        : warnWithoutDevice && !person.has_device
                          ? "No device"
                          : single
                            ? "Select"
                            : "Add"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-text-muted">
        {single
          ? selected.length === 0
            ? "Nobody selected yet."
            : `Sending to ${selected[0].name}.`
          : selected.length === 0
            ? "Nobody selected yet — an empty list reaches nobody, not everybody."
            : `${selected.length} selected`}
      </p>
    </div>
  );
}
