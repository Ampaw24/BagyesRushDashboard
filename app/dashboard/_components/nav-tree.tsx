"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavEntry, NavIconKey } from "../_lib/nav-items";
import {
  BagIcon,
  ChevronDownIcon,
  MegaphoneIcon,
  OrdersIcon,
  OverviewIcon,
  RidersIcon,
  SecuritySafeIcon,
  SettingsIcon,
  ShopIcon,
  StarIcon,
  SupportIcon,
  TicketIcon,
  UsersIcon,
  WalletIcon,
  type IconComponent,
} from "../_lib/icons";
import { useSidebarCollapsed } from "../_hooks/use-sidebar-collapsed";

/**
 * Icon components live on this side of the boundary. The server sends a key,
 * because a function cannot be serialized into a Client Component's props.
 */
const NAV_ICONS: Record<NavIconKey, IconComponent> = {
  overview: OverviewIcon,
  orders: OrdersIcon,
  // riders: RidersIcon,
  coupons: TicketIcon,
  transactions: WalletIcon,
  users: UsersIcon,
  // support: SupportIcon,
  // communications: MegaphoneIcon,
  vendors: ShopIcon,
  catalogue: BagIcon,
  reviews: StarIcon,
  administration: SecuritySafeIcon,
  // settings: SettingsIcon,
};

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-status-critical px-1.5 text-xs font-semibold text-white">
      {count}
    </span>
  );
}

function NavBadgeDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-status-critical" />;
}

type NavTreeProps = {
  /** Built per request in the dashboard layout, from live counts and permissions. */
  entries: NavEntry[];
  onNavigate?: () => void;
  collapsed?: boolean;
};

export function NavTree({ entries, onNavigate, collapsed = false }: NavTreeProps) {
  const pathname = usePathname();
  const { toggleCollapsed } = useSidebarCollapsed();
  const [openSections, setOpenSections] = useState<Set<string>>(
    () =>
      new Set(
        entries
          .filter(
            (entry) => entry.kind === "section" && entry.children.some((child) => child.href === pathname)
          )
          .map((entry) => entry.label)
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

  function handleSectionClick(label: string) {
    if (collapsed) {
      toggleCollapsed();
      setOpenSections((prev) => new Set(prev).add(label));
      return;
    }
    toggleSection(label);
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {entries.map((entry, index) => {
        const animationDelay = { animationDelay: `${Math.min(index, 8) * 30}ms` };

        if (entry.kind === "link") {
          const isActive = pathname === entry.href;
          const Icon = NAV_ICONS[entry.icon];
          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onNavigate}
              title={collapsed ? entry.label : undefined}
              style={animationDelay}
              className={`animate-nav-item relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-150 ${
                collapsed ? "justify-center px-0" : ""
              } ${isActive ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-surface-muted"}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {collapsed ? (
                typeof entry.badge === "number" && <NavBadgeDot count={entry.badge} />
              ) : (
                <>
                  <span className="flex-1 break-words">{entry.label}</span>
                  {typeof entry.badge === "number" && <NavBadge count={entry.badge} />}
                </>
              )}
            </Link>
          );
        }

        const isOpen = openSections.has(entry.label) && !collapsed;
        const hasActiveChild = entry.children.some((child) => child.href === pathname);
        const Icon = NAV_ICONS[entry.icon];

        return (
          <div key={entry.label} style={animationDelay} className="animate-nav-item flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleSectionClick(entry.label)}
              aria-expanded={isOpen}
              title={collapsed ? entry.label : undefined}
              className={`relative flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-150 ${
                collapsed ? "justify-center px-0" : ""
              } ${hasActiveChild ? "text-brand" : "text-text-secondary hover:bg-surface-muted"}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {collapsed ? (
                hasActiveChild && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" />
              ) : (
                <>
                  <span className="flex-1 break-words text-left">{entry.label}</span>
                  <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
                </>
              )}
            </button>

            {isOpen && (
              <div className="animate-nav-item flex flex-col gap-0.5 rounded-lg bg-surface-muted py-1">
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
