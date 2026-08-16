"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import logo from "@/public/icon.jpeg";
import { CloseIcon, MenuIcon } from "../_lib/icons";
import type { NavEntry } from "../_lib/nav-items";
import { LogoutButton } from "./logout-button";
import { NavTree } from "./nav-tree";
import { ThemeToggle } from "./theme-toggle";

export function MobileNav({ navTree }: { navTree: NavEntry[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition duration-150 hover:bg-surface-muted lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <div className="fixed inset-0 z-40 lg:hidden" aria-hidden={!open} style={{ pointerEvents: open ? "auto" : "none" }}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-surface shadow-sm transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <span className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                <Image src={logo} alt="Bagyes Rush Delivery" width={36} height={36} className="h-full w-full object-contain" />
              </span>
              <span className="text-sm font-semibold tracking-wide text-foreground">Bagyes Rush</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition duration-150 hover:bg-surface-muted"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <NavTree entries={navTree} onNavigate={() => setOpen(false)} />

          <div className="flex flex-col gap-1 border-t border-border-subtle px-3 py-4">
            <ThemeToggle variant="row" />
            <LogoutButton onDone={() => setOpen(false)} />
          </div>
        </aside>
      </div>
    </>
  );
}
