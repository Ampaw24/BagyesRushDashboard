"use client";

import { useEffect, useRef, useState } from "react";

import { DownloadIcon, ExportIcon, WhatsappIcon } from "../_lib/icons";
import {
  downloadRecordCsv,
  printRecord,
  shareRecordOnWhatsApp,
  type ExportableRecord,
} from "@/lib/export/record-export";

/**
 * "Export" for a single record, on a detail screen or inside a dialog.
 *
 * Takes either a finished `record` or a `build` function, and the difference
 * is the server/client boundary rather than taste.
 *
 * A dialog fills in over a request, so it passes `build`: rendering with
 * whatever had loaded at mount would export a half-empty record, and calling it
 * at click time always sees what is on screen. But a function cannot be passed
 * from a server component to a client one, and the order screen is a server
 * component - so that one builds the record on the server and passes the plain
 * object, which serialises.
 *
 * Disabled until the data it would export has arrived, because a file with
 * "Loading…" in it is worse than a button that is briefly unavailable.
 */
export function RecordExportButton({
  record,
  build,
  disabled = false,
  label = "Export",
  className,
}: {
  /** A finished record. Use this from a server component. */
  record?: ExportableRecord;
  /** Built at click time. Use this wherever the data arrives after mount. */
  build?: () => ExportableRecord;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  /**
   * Which way the menu opens.
   *
   * It lives in two very different places: the header of a detail page, where
   * there is a screenful below it, and the footer of a dialog, where there is
   * nothing below it at all. Opening downward from a footer put the menu off
   * the bottom of the window, which reads as the dropdown "hiding under the
   * page" - it is there, just below everything.
   *
   * Measured on open rather than passed in, so neither call site has to know
   * where it sits.
   */
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const rect = trigger.current?.getBoundingClientRect();

    // The menu is roughly 190px tall with three items. Flip up whenever the
    // space below would not hold it, with a little margin.
    if (rect) setDropUp(window.innerHeight - rect.bottom < 220);

    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      // Stops the dialog underneath from closing at the same time.
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape, true);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape, true);
    };
  }, [open]);

  const run = (action: (value: ExportableRecord) => void) => () => {
    const value = build ? build() : record;

    setOpen(false);

    // Nothing to export is not an error worth shouting about - the trigger is
    // disabled in that state, so this only guards a caller that passed neither.
    if (value) action(value);
  };

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 items-center gap-2 rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ExportIcon className="h-4 w-4" />
        {label}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-[60] flex w-64 flex-col gap-0.5 rounded-lg border border-border-subtle bg-surface p-1.5 shadow-lg ${
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={run(printRecord)}
            className="flex min-h-10 w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition duration-150 hover:bg-surface-muted"
          >
            <ExportIcon className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
            <span className="flex flex-col">
              <span className="text-sm text-foreground">Print or save as PDF</span>
              <span className="text-xs text-text-muted">
                Choose &ldquo;Save as PDF&rdquo; in the print dialog.
              </span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={run(shareRecordOnWhatsApp)}
            className="flex min-h-10 w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition duration-150 hover:bg-surface-muted"
          >
            <WhatsappIcon className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
            <span className="flex flex-col">
              <span className="text-sm text-foreground">Send on WhatsApp</span>
              <span className="text-xs text-text-muted">
                As a message. WhatsApp asks who to send it to.
              </span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={run(downloadRecordCsv)}
            className="flex min-h-10 w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition duration-150 hover:bg-surface-muted"
          >
            <DownloadIcon className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
            <span className="flex flex-col">
              <span className="text-sm text-foreground">Download CSV</span>
              <span className="text-xs text-text-muted">For a spreadsheet.</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
