"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnalyticsIcon, OrdersIcon, OverviewIcon, RidersIcon } from "../_lib/icons";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: OverviewIcon },
  { href: "/dashboard/orders", label: "Orders", icon: OrdersIcon },
  { href: "/dashboard/riders", label: "Riders", icon: RidersIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: AnalyticsIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border-subtle bg-surface lg:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition duration-150 ${
              isActive ? "text-brand" : "text-text-muted"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
