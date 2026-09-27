import type { ReactNode } from "react";
import { MobileTopbar } from "./_components/mobile-topbar";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";
import { getAdminProfile } from "@/lib/services/profile.service";
import { toSessionAdmin } from "@/lib/mappers/admin-profile.mapper";
import { getNavCounts } from "@/lib/services/nav-counts.service";
import { ToastProvider } from "./_components/toast-provider";
import { UpdateBanner } from "./_components/update-banner";
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
        {/* `min-w-0` is load-bearing, not tidying.

            A flex item defaults to `min-width: auto`, which means it refuses to
            shrink below its own content. A table wider than the viewport
            therefore stretched this column to the table's width instead of
            letting `TableShell`'s `overflow-x-auto` scroll inside it — so the
            page itself scrolled sideways and the whole layout moved with it.

            The header went along for the ride, which is why the top-right
            dropdowns appeared to fall outside the layout: they are anchored to
            a bar that had quietly become 1800px wide. One property, both bugs. */}
        <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col transition-[padding-left] duration-200 ease-out lg:pl-[var(--sidebar-w)]">
          <MobileTopbar admin={admin} navTree={navTree} />
          <Topbar admin={admin} />
          {/* Same reasoning one level down: `main` is a flex item too.

              `overflow-x-clip` is the guarantee on top of it. `min-w-0` fixes
              the cause, but only for children that size themselves the way
              flexbox expects - anything that ends up wider for its own reasons
              can still push the page sideways, and the symptom (scroll past the
              end of a table and the whole layout slides) is the same either way.

              `clip` rather than `hidden` deliberately: `overflow-x: hidden`
              computes `overflow-y` to `auto`, which would turn this into a
              scroll container and trap sticky headers and dropdowns inside it.
              `clip` just clips, and leaves the vertical axis visible. */}
          <main className="min-w-0 flex-1 overflow-x-clip px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>

        {/* Mounted once for the whole dashboard rather than per screen: a tab is
            stale regardless of which page is open, and the check is one small
            same-origin request on a slow timer. */}
        <UpdateBanner />
      </div>
    </ToastProvider>
  );
}
