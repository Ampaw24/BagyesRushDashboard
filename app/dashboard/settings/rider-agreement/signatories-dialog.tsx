"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Avatar } from "../../_components/avatar";
import { Badge } from "../../_components/status-badge";
import { riderStatusMeta } from "../../_lib/status";
import { formatDateTime } from "../../_lib/format";
import { loadSignatoriesAction } from "./_actions";
import type { RiderAgreementRow } from "@/lib/mappers/rider-agreement.mapper";
import type { RiderStatus } from "@/lib/types/enums";

type Signatory = {
  id: number;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  status: RiderStatus;
  acceptedAt: string | null;
};

/**
 * Who has signed one version of the rider agreement.
 *
 * Opened from the count in the agreements table, and lists exactly the riders
 * behind that number: those whose current acceptance is this version. A rider
 * who goes on to accept a newer version moves to that version's list - which
 * is what makes the dialog useful after publishing one, to see who has
 * re-accepted and who still needs chasing.
 */
export function SignatoriesDialog({
  agreement,
  onClose,
}: {
  agreement: RiderAgreementRow;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<Signatory[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [failure, setFailure] = useState("");

  const load = useCallback(
    async (nextPage: number, term: string, append: boolean) => {
      const result = await loadSignatoriesAction(agreement.id, nextPage, term);

      if (!result.ok) {
        setFailure(result.message);
        if (!append) setRows([]);
        return;
      }

      setFailure("");
      setTotal(result.data.total);
      setHasMore(result.data.hasMore);
      setPage(nextPage);
      setRows((previous) => (append ? [...(previous ?? []), ...result.data.items] : result.data.items));
    },
    [agreement.id],
  );

  useEffect(() => {
    let cancelled = false;

    loadSignatoriesAction(agreement.id, 1, "").then((result) => {
      if (cancelled) return;

      if (!result.ok) {
        setFailure(result.message);
        setRows([]);
        return;
      }

      setTotal(result.data.total);
      setHasMore(result.data.hasMore);
      setRows(result.data.items);
    });

    return () => {
      cancelled = true;
    };
  }, [agreement.id]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRows(null);
    void load(1, search, false);
  }

  async function loadMore() {
    setLoadingMore(true);
    await load(page + 1, search, true);
    setLoadingMore(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Riders who signed ${agreement.version}`}
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 overflow-hidden rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="break-words text-base font-semibold text-foreground">
            {agreement.version} &middot; signed by
          </h2>
          <p className="break-words text-sm text-text-secondary">
            {total.toLocaleString()} rider{total === 1 ? "" : "s"} currently hold this version,
            newest first. A rider who accepts a newer version moves to that one&rsquo;s list.
          </p>
        </div>

        <form onSubmit={submitSearch} className="flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, phone or plate"
            aria-label="Search riders"
            className="h-11 min-w-0 flex-1 rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
          <button
            type="submit"
            className="flex h-11 shrink-0 items-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
          >
            Search
          </button>
        </form>

        {failure && (
          <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
            {failure}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border-subtle">
          {rows === null ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted">Loading&hellip;</p>
          ) : rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted">
              {failure
                ? "Could not load the riders."
                : search.trim()
                  ? "No rider who signed this version matches that search."
                  : "No rider currently holds this version."}
            </p>
          ) : (
            <ul className="flex flex-col">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-3 border-t border-border-subtle px-4 py-3 first:border-t-0"
                >
                  <Avatar name={row.name} src={row.photoUrl ?? undefined} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/dashboard/riders/${row.id}`}
                      className="break-words text-sm font-medium text-brand transition duration-150 hover:opacity-80"
                    >
                      {row.name || `Rider #${row.id}`}
                    </Link>
                    <span className="text-xs text-text-muted">{row.phone ?? "No phone"}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1 text-right">
                    <Badge meta={riderStatusMeta[row.status]} />
                    <span className="text-xs text-text-muted">
                      {row.acceptedAt ? `Signed ${formatDateTime(new Date(row.acceptedAt))}` : "—"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-text-muted">
            {rows !== null && rows.length > 0 && `Showing ${rows.length.toLocaleString()} of ${total.toLocaleString()}`}
          </span>
          <div className="flex items-center gap-3">
            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            )}
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
    </div>
  );
}
