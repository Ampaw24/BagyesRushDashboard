"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "./avatar";
import { ChevronDownIcon } from "../_lib/icons";
import { LogoutButton } from "./logout-button";

type AdminProfileMenuProps = {
  id: number;
  name: string;
  /** Already resolved by the API (`role_label` on GET /admin/me). */
  roleLabel: string;
  showDetails?: boolean;
};

export function AdminProfileMenu({ id, name, roleLabel, showDetails = true }: AdminProfileMenuProps) {
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex min-h-11 items-center gap-2.5 rounded-lg px-2 transition duration-150 hover:bg-surface-muted"
      >
        <Avatar name={name} className="h-9 w-9 text-xs" />
        {showDetails && (
          <span className="hidden flex-col items-start leading-tight sm:flex">
            <span className="text-sm font-medium text-foreground">{name}</span>
            <span className="text-xs text-text-muted">{roleLabel}</span>
          </span>
        )}
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1 flex w-56 flex-col gap-0.5 rounded-lg border border-border-subtle bg-surface p-1.5 shadow-sm">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <Avatar name={name} className="h-9 w-9 text-xs" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-foreground">{name}</span>
              <span className="text-xs text-text-muted">{roleLabel}</span>
            </span>
          </div>
          <div className="my-1 border-t border-border-subtle" />
          <Link
            href={`/dashboard/administration/admins/${id}`}
            onClick={() => setOpen(false)}
            className="flex min-h-9 items-center rounded-md px-3 text-sm text-text-secondary transition duration-150 hover:bg-surface-muted"
          >
            View profile
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex min-h-9 items-center rounded-md px-3 text-sm text-text-secondary transition duration-150 hover:bg-surface-muted"
          >
            Account &amp; password
          </Link>
          <LogoutButton
            onDone={() => setOpen(false)}
            className="flex min-h-9 w-full items-center gap-2 rounded-md px-3 text-sm text-status-critical transition duration-150 hover:bg-status-critical/10 disabled:opacity-60"
          />
        </div>
      )}
    </div>
  );
}
