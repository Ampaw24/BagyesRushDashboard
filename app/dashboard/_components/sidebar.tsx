"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/public/icon.jpeg";
import { AnalyticsIcon, LogoutIcon, OrdersIcon, OverviewIcon, RidersIcon } from "../_lib/icons";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: OverviewIcon },
  { href: "/dashboard/orders", label: "Orders", icon: OrdersIcon },
  { href: "/dashboard/riders", label: "Riders", icon: RidersIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: AnalyticsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 shrink-0 flex-col border-r border-border-subtle bg-surface lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          <Image src={logo} alt="Bagyes Rush Delivery" width={40} height={40} className="h-full w-full object-contain" priority />
        </span>
        <span className="break-words text-sm font-semibold tracking-wide text-foreground">Bagyes Rush</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-150 ${
                isActive ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-surface-muted"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="break-words">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle px-3 py-4">
        <Link
          href="/login"
          className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          <LogoutIcon className="h-5 w-5 shrink-0" />
          Log out
        </Link>
      </div>
    </aside>
  );
}
