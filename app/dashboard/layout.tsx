import type { ReactNode } from "react";
import { MobileTopbar } from "./_components/mobile-topbar";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";
import { getAdminProfile } from "@/lib/services/profile.service";
import { toSessionAdmin } from "@/lib/mappers/admin-profile.mapper";
import { getNavCounts } from "@/lib/services/nav-counts.service";
import { ToastProvider } from "./_components/toast-provider";
import { buildNavTree } from "./_lib/nav-items";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Resolves the real session. A revoked token 401s here, and the API client
  // redirects to /logout, so the shell never renders for a dead session.
  const admin = toSessionAdmin(await getAdminProfile());
  const counts = await getNavCounts(admin.permissions);

  // The tree is built per request so badges carry live totals and entries the
  // admin's role cannot reach are never rendered.
  const navTree = buildNavTree({ counts, permissions: admin.permissions });

  return (
    // ToastProvider is a client boundary wrapping the whole dashboard, so any
    // action anywhere can surface the backend's own message.
    <ToastProvider>
      <div className="flex min-h-screen w-full bg-surface-muted">
        <Sidebar navTree={navTree} />
        <div className="flex min-h-screen w-full flex-1 flex-col transition-[padding-left] duration-200 ease-out lg:pl-[var(--sidebar-w)]">
          <MobileTopbar admin={admin} navTree={navTree} />
          <Topbar admin={admin} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
