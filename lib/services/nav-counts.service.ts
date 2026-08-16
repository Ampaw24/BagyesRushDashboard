import { apiFetch } from "../api/client";
import { isApiError } from "../api/errors";
import type { OrderStatsDto } from "../types/api";
import type { Paginated } from "../api/types";
import type { Permission } from "../types/enums";

/** Live totals behind the sidebar badges. */
export type NavCounts = {
  pendingOrders: number;
  pendingVendors: number;
};

/**
 * Badge counts for the sidebar.
 *
 * Requested per render alongside the layout, and deliberately forgiving: a
 * badge is decoration, so a failing count degrades to zero rather than taking
 * down every dashboard page. Each call is skipped entirely when the admin's
 * role cannot read that resource.
 */
export async function getNavCounts(permissions: readonly Permission[]): Promise<NavCounts> {
  const [pendingOrders, pendingVendors] = await Promise.all([
    permissions.includes("orders.view") ? countPendingOrders() : Promise.resolve(0),
    permissions.includes("vendors.view") ? countPendingVendors() : Promise.resolve(0),
  ]);

  return { pendingOrders, pendingVendors };
}

async function countPendingOrders(): Promise<number> {
  try {
    const stats = await apiFetch<OrderStatsDto>("/admin/orders/stats");
    return stats.by_status.pending ?? 0;
  } catch (error) {
    return rethrowUnexpected(error, 0);
  }
}

async function countPendingVendors(): Promise<number> {
  try {
    // `per_page=1` because only `pagination.total` is wanted — there is no
    // count-only endpoint.
    const page = await apiFetch<Paginated<unknown>>("/admin/vendors", {
      query: { status: "pending_review", per_page: 1 },
    });
    return page.pagination.total;
  } catch (error) {
    return rethrowUnexpected(error, 0);
  }
}

/**
 * Swallows API errors (a badge is not worth an error screen) but lets Next's
 * own control-flow errors through — `redirect()` from a 401 must not be caught.
 */
function rethrowUnexpected(error: unknown, fallback: number): number {
  if (isApiError(error)) return fallback;
  throw error;
}
