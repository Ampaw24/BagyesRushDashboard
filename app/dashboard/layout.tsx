import type { ReactNode } from "react";
import { MobileTopbar } from "./_components/mobile-topbar";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";
import { getAdminUserById } from "./_services/mock-data";
import { CURRENT_ADMIN_ID } from "./_services/administration-mock-data";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const currentAdmin = await getAdminUserById(CURRENT_ADMIN_ID);
  const admin = { id: CURRENT_ADMIN_ID, name: currentAdmin?.name ?? "Admin", role: currentAdmin?.role ?? "admin" };

  return (
    <div className="flex min-h-screen w-full bg-surface-muted">
      <Sidebar />
      <div className="flex min-h-screen w-full flex-1 flex-col transition-[padding-left] duration-200 ease-out lg:pl-[var(--sidebar-w)]">
        <MobileTopbar admin={admin} />
        <Topbar admin={admin} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
