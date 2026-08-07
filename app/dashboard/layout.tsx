import type { ReactNode } from "react";
import { BottomNav } from "./_components/bottom-nav";
import { MobileTopbar } from "./_components/mobile-topbar";
import { Sidebar } from "./_components/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-surface-muted">
      <Sidebar />
      <div className="flex min-h-screen w-full flex-1 flex-col lg:pl-64">
        <MobileTopbar />
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
