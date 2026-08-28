"use client";

import Image from "next/image";
import logo from "@/public/icon.jpeg";
import { useSidebarCollapsed } from "../_hooks/use-sidebar-collapsed";
import { PanelLeftIcon } from "../_lib/icons";
import type { NavEntry } from "../_lib/nav-items";
import { LogoutButton } from "./logout-button";
import { NavTree } from "./nav-tree";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar({ navTree }: { navTree: NavEntry[] }) {
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();

  return (
    <aside
      className="fixed inset-y-0 left-0 hidden w-[var(--sidebar-w)] shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-border-subtle bg-surface transition-[width] duration-200 ease-out lg:flex"
    >
      <div className={`flex items-center gap-3 px-6 py-6 ${collapsed ? "justify-center px-3" : ""}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          <Image src={logo} alt="BagyesRUSH" width={40} height={40} className="h-full w-full object-contain" priority />
        </span>
        <span
          className={`break-words text-sm font-semibold tracking-wide text-foreground transition-opacity duration-150 ${
            collapsed ? "hidden opacity-0" : "opacity-100"
          }`}
        >
          BagyesRUSH
        </span>
      </div>

      <NavTree entries={navTree} collapsed={collapsed} />

      <div className={`flex flex-col gap-1 border-t border-border-subtle px-3 py-4 ${collapsed ? "items-center px-2" : ""}`}>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-pressed={collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <PanelLeftIcon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span aria-hidden="true">Collapse</span>}
          <span className="sr-only">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
        </button>

        <ThemeToggle variant={collapsed ? "icon" : "row"} />

        <LogoutButton showLabel={!collapsed} />
      </div>
    </aside>
  );
}
