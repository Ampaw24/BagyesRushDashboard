import type { ReactNode } from "react";
import { MobileTopbar } from "./_components/mobile-topbar";
import { Sidebar } from "./_components/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-surface-muted">
      <Sidebar />
      <div className="flex min-h-screen w-full flex-1 flex-col transition-[padding-left] duration-200 ease-out lg:pl-[var(--sidebar-w)]">
        <MobileTopbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
