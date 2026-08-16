"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { MoreIcon } from "../_lib/icons";
import type { IconComponent } from "../_lib/icons";

export type ActionMenuItem = {
  label: string;
  /**
   * May return a promise. When it does, the menu stays open and shows the item
   * as busy until it settles — so a direct Server Action call (a status toggle,
   * say) reports progress instead of running invisibly.
   */
  onClick: () => void | Promise<unknown>;
  icon?: IconComponent;
  danger?: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

/** Menu width (w-52 = 13rem) and the gap it keeps from the trigger and viewport edges. */
const MENU_WIDTH = 208;
const GAP = 4;
const EDGE = 8;

/** `maxHeight` caps the panel so it can never extend past the viewport. */
type Position = { top: number; left: number; maxHeight: number };

/** Never shrink the panel below roughly two rows — scrolling is better than a sliver. */
const MIN_PANEL_HEIGHT = 96;

/**
 * Row actions menu.
 *
 * The panel is rendered through a portal and positioned `fixed` rather than
 * absolutely inside the row. TableShell wraps every table in `overflow-x-auto`,
 * which establishes a clipping context — and because `overflow-x: auto` forces
 * the computed `overflow-y` to `auto` as well, an absolutely-positioned panel
 * was clipped at both the right edge and the last rows. Escaping to the body
 * keeps the table's horizontal scrolling intact without cutting the menu off.
 */
export function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  /** Label of the item currently running, so only that row shows a spinner. */
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Measure after the panel is in the DOM so it can flip up near the viewport
  // bottom instead of overflowing it.
  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const rect = trigger.getBoundingClientRect();
      // scrollHeight, not offsetHeight: the natural height, unaffected by a
      // maxHeight cap from a previous pass feeding back into this one.
      const height = menu.scrollHeight;

      const spaceBelow = window.innerHeight - rect.bottom - GAP - EDGE;
      const spaceAbove = rect.top - GAP - EDGE;

      let top: number;
      let maxHeight: number;

      if (height <= spaceBelow) {
        // Preferred: directly below the trigger.
        top = rect.bottom + GAP;
        maxHeight = spaceBelow;
      } else if (height <= spaceAbove) {
        // Flip up for rows near the bottom of the viewport.
        top = rect.top - height - GAP;
        maxHeight = spaceAbove;
      } else if (spaceBelow >= spaceAbove) {
        // Fits neither way: take the roomier side and let the panel scroll.
        // Without this the panel ran off-screen, and because it is positioned
        // `fixed` it moved with the row, so scrolling never revealed it.
        top = rect.bottom + GAP;
        maxHeight = spaceBelow;
      } else {
        top = EDGE;
        maxHeight = spaceAbove;
      }

      // Right-aligned to the trigger, then clamped inside the viewport.
      const left = Math.min(
        Math.max(EDGE, rect.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - EDGE,
      );

      setPosition({ top, left, maxHeight: Math.max(maxHeight, MIN_PANEL_HEIGHT) });
    }

    place();

    // `capture` so scrolling the table's own overflow container repositions the
    // panel too, not just the page.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      // The panel now lives outside the trigger's subtree, so both are checked.
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggle() {
    setOpen((value) => {
      // Drop the stale position so the panel never flashes at its old spot.
      if (value) setPosition(null);
      return !value;
    });
  }

  const panel = (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Actions"
      style={{
        position: "fixed",
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        width: MENU_WIDTH,
        maxHeight: position?.maxHeight,
        // Hidden for the first paint, before the measurement lands.
        visibility: position ? "visible" : "hidden",
      }}
      className="z-50 flex flex-col gap-0.5 overflow-y-auto rounded-lg border border-border-subtle bg-surface p-1.5 shadow-sm"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const busy = busyLabel === item.label;

        return (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            // Every item locks while one is running, so a slow request cannot
            // be double-fired or raced by a second action on the same row.
            disabled={item.disabled || busyLabel !== null}
            title={item.disabled ? item.disabledReason : undefined}
            onClick={async () => {
              const result = item.onClick();

              // Synchronous handlers just open a dialog; close and get out of
              // the way. Async ones are real work, so stay and show progress.
              if (!(result instanceof Promise)) {
                setOpen(false);
                return;
              }

              setBusyLabel(item.label);
              try {
                await result;
              } finally {
                setBusyLabel(null);
                setOpen(false);
              }
            }}
            // shrink-0 so items keep their height when the panel is capped and scrolls.
            className={`flex min-h-9 shrink-0 items-center gap-2.5 rounded-md px-3 text-left text-sm transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
              item.danger
                ? "text-status-critical hover:bg-status-critical/10"
                : "text-text-secondary hover:bg-surface-muted"
            }`}
          >
            {busy ? <Spinner /> : Icon && <Icon className="h-4 w-4 shrink-0" />}
            {busy ? "Working…" : item.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Actions"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition duration-150 hover:bg-surface-muted"
      >
        <MoreIcon className="h-4.5 w-4.5" />
      </button>

      {/* `open` only ever becomes true from a click, so `document` is always
          available by the time this renders — no mounted guard needed. */}
      {open && createPortal(panel, document.body)}
    </div>
  );
}

/** Inline busy indicator, sized to sit where a menu item's icon would. */
function Spinner() {
  return (
    <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z" />
    </svg>
  );
}
