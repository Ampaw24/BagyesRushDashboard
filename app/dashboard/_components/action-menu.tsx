"use client";

import { useEffect, useRef, useState } from "react";
import { MoreIcon } from "../_lib/icons";
import type { IconComponent } from "../_lib/icons";

export type ActionMenuItem = {
  label: string;
  onClick: () => void;
  icon?: IconComponent;
  danger?: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

export function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Actions"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition duration-150 hover:bg-surface-muted"
      >
        <MoreIcon className="h-4.5 w-4.5" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 flex w-52 flex-col gap-0.5 rounded-lg border border-border-subtle bg-surface p-1.5 shadow-sm">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                title={item.disabled ? item.disabledReason : undefined}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`flex min-h-9 items-center gap-2.5 rounded-md px-3 text-left text-sm transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                  item.danger ? "text-status-critical hover:bg-status-critical/10" : "text-text-secondary hover:bg-surface-muted"
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
