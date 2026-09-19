"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavEntry, NavIconKey } from "../_lib/nav-items";
import {
  ActivityIcon,
  ArchiveIcon,
  BagIcon,
  ChartIcon,
  ChatIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  CoinsIcon,
  DangerIcon,
  PackageFailedIcon,
  EyeIcon,
  GiftIcon,
  HandshakeIcon,
  ImageIcon,
  MailIcon,
  MapPinIcon,
  MegaphoneIcon,
  OrdersIcon,
  OverviewIcon,
  PlusIcon,
  ProfileDeleteIcon,
  ProfileTickIcon,
  RefreshIcon,
  RidersIcon,
  SecuritySafeIcon,
  SettingsIcon,
  ShieldIcon,
  ShopIcon,
  StarIcon,
  SupportIcon,
  TableIcon,
  TicketIcon,
  TrashIcon,
  UsersIcon,
  WalletIcon,
  XCircleIcon,
  type IconComponent,
} from "../_lib/icons";
import { useSidebarCollapsed } from "../_hooks/use-sidebar-collapsed";
import { navAccent, navTint } from "../_lib/nav-accents";

/**
 * Icon components live on this side of the boundary. The server sends a key,
 * because a function cannot be serialized into a Client Component's props.
 */
const NAV_ICONS: Record<NavIconKey, IconComponent> = {
  overview: OverviewIcon,
  orders: OrdersIcon,
  riders: RidersIcon,
  coupons: TicketIcon,
  transactions: WalletIcon,
  users: UsersIcon,
  support: SupportIcon,
  chat: ChatIcon,
  communications: MegaphoneIcon,
  vendors: ShopIcon,
  catalogue: BagIcon,
  reviews: StarIcon,
  administration: SecuritySafeIcon,
  settings: SettingsIcon,
  // Sub-item glyphs. Reused from the same module so the sidebar never mixes
  // two icon sets.
  map: MapPinIcon,
  clock: ClockIcon,
  check: CheckCircleIcon,
  cancel: XCircleIcon,
  activity: ActivityIcon,
  archive: ArchiveIcon,
  chart: ChartIcon,
  profileTick: ProfileTickIcon,
  profileDelete: ProfileDeleteIcon,
  trash: TrashIcon,
  plus: PlusIcon,
  image: ImageIcon,
  shield: ShieldIcon,
  coins: CoinsIcon,
  gift: GiftIcon,
  handshake: HandshakeIcon,
  refresh: RefreshIcon,
  eye: EyeIcon,
  danger: DangerIcon,
  packageFailed: PackageFailedIcon,
  bag: BagIcon,
  star: StarIcon,
  shop: ShopIcon,
  ticket: TicketIcon,
  mail: MailIcon,
  list: TableIcon,
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
          const accent = navAccent(entry.icon);
          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onNavigate}
              title={collapsed ? entry.label : undefined}
              style={{
                ...animationDelay,
                color: accent,
                // Read back by `.nav-item:hover` in globals.css, so the hover
                // wash is the row's own colour rather than one grey for all.
                ["--item-accent" as string]: accent,
                // The active item is a thin tint of its own accent behind the
                // same colour it already draws in. One token, two states, no
                // second palette to keep in step.
                background: isActive ? navTint(accent, 12) : undefined,
                borderColor: isActive ? navTint(accent, 34) : "transparent",
              }}
              className={`nav-item animate-nav-item relative flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm transition duration-150 ${
                collapsed ? "justify-center px-0" : ""
              } ${isActive ? "font-semibold" : "font-medium"}`}
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
        const accent = navAccent(entry.icon);

        return (
          <div key={entry.label} style={animationDelay} className="animate-nav-item flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleSectionClick(entry.label)}
              aria-expanded={isOpen}
              title={collapsed ? entry.label : undefined}
              style={{
                color: accent,
                ["--item-accent" as string]: accent,
                background: hasActiveChild ? navTint(accent, 12) : undefined,
                borderColor: hasActiveChild ? navTint(accent, 34) : "transparent",
              }}
              className={`nav-item relative flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 text-sm transition duration-150 ${
                collapsed ? "justify-center px-0" : ""
              } ${hasActiveChild ? "font-semibold" : "font-medium"}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {collapsed ? (
                hasActiveChild && (
                  <span
                    className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                    style={{ background: accent }}
                  />
                )
              ) : (
                <>
                  <span className="flex-1 break-words text-left">{entry.label}</span>
                  <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
                </>
              )}
            </button>

            {isOpen && (
              <div
                className="animate-nav-item flex flex-col gap-0.5 rounded-lg border-l-2 bg-sidebar-muted py-1"
                // A rule in the parent's colour, so a long open section still
                // reads as belonging to the heading scrolled off above it.
                style={{ borderColor: navTint(accent, 45) }}
              >
                {entry.children.map((child) => {
                  const isActive = pathname === child.href;
                  const ChildIcon = child.icon ? NAV_ICONS[child.icon] : null;
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      style={{
                        color: isActive ? accent : undefined,
                        ["--item-accent" as string]: accent,
                        background: isActive ? navTint(accent, 10) : undefined,
                      }}
                      className={`nav-item flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 pl-7 text-sm transition duration-150 ${
                        isActive ? "font-semibold" : "font-medium text-text-secondary hover:text-foreground"
                      }`}
                    >
                      {ChildIcon ? (
                        <ChildIcon
                          className="h-4 w-4 shrink-0"
                          // Leaf glyphs take the parent's colour, muted when
                          // inactive: enough to tie the row to its section, not
                          // enough to compete with the heading above it.
                          style={{ color: isActive ? accent : navTint(accent, 65) }}
                        />
                      ) : (
                        // Keeps labels aligned whether or not a leaf has one.
                        <span className="h-4 w-4 shrink-0" />
                      )}
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
