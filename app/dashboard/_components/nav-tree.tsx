"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_TREE } from "../_lib/nav-items";
import { ChevronDownIcon } from "../_lib/icons";

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-status-critical px-1.5 text-xs font-semibold text-white">
      {count}
    </span>
  );
}

export function NavTree({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(
    () =>
      new Set(
        NAV_TREE.filter(
          (entry) => entry.kind === "section" && entry.children.some((child) => child.href === pathname)
        ).map((entry) => entry.label)
      )
  );

  function toggleSection(label: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_TREE.map((entry) => {
        if (entry.kind === "link") {
          const isActive = pathname === entry.href;
          const Icon = entry.icon;
          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onNavigate}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-150 ${
                isActive ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-surface-muted"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 break-words">{entry.label}</span>
              {typeof entry.badge === "number" && <NavBadge count={entry.badge} />}
            </Link>
          );
        }

        const isOpen = openSections.has(entry.label);
        const hasActiveChild = entry.children.some((child) => child.href === pathname);
        const Icon = entry.icon;

        return (
          <div key={entry.label} className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => toggleSection(entry.label)}
              aria-expanded={isOpen}
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-150 ${
                hasActiveChild ? "text-brand" : "text-text-secondary hover:bg-surface-muted"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 break-words text-left">{entry.label}</span>
              <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="flex flex-col gap-0.5 rounded-lg bg-surface-muted py-1">
                {entry.children.map((child) => {
                  const isActive = pathname === child.href;
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={`flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 pl-11 text-sm font-medium transition duration-150 ${
                        isActive ? "text-brand" : "text-text-secondary hover:text-foreground"
                      }`}
                    >
                      <span className="flex-1 break-words">{child.label}</span>
                      {typeof child.badge === "number" && <NavBadge count={child.badge} />}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
