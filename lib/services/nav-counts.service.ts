import { apiFetch } from "../api/client";
import { isApiError } from "../api/errors";
import type { OrderStatsDto } from "../types/api";
import type { Paginated } from "../api/types";
import type { Permission } from "../types/enums";

/** Live totals behind the sidebar badges. */
export type NavCounts = {
  pendingOrders: number;
  pendingVendors: number;
  /** Completed rider applications waiting on a decision. */
  riderRequests: number;
  /** Live orders no rider accepted, waiting on a human. */
  ordersNeedingDispatch: number;
  /** Riders waiting to be paid. */
  withdrawalRequests: number;
  /** Complaints nobody has looked at yet. */
  openReports: number;
  /** Broadcasts waiting for their send time. */
  scheduledCommunications: number;
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
  const [
    pendingOrders,
    pendingVendors,
    riderRequests,
    ordersNeedingDispatch,
    withdrawalRequests,
    openReports,
    scheduledCommunications,
  ] = await Promise.all([
    permissions.includes("orders.view") ? countPendingOrders() : Promise.resolve(0),
    permissions.includes("vendors.view") ? countPendingVendors() : Promise.resolve(0),
    permissions.includes("riders.view") ? countRiderRequests() : Promise.resolve(0),
    permissions.includes("dispatch.manage") ? countNeedingDispatch() : Promise.resolve(0),
    permissions.includes("withdrawals.view") ? countWithdrawalRequests() : Promise.resolve(0),
    permissions.includes("reports.view") ? countOpenReports() : Promise.resolve(0),
    permissions.includes("communications.view") ? countScheduled() : Promise.resolve(0),
  ]);

  return {
    pendingOrders,
    pendingVendors,
    riderRequests,
    ordersNeedingDispatch,
    withdrawalRequests,
    openReports,
    scheduledCommunications,
  };
}

/** Pending and in-review together: both are still somebody's work. */
async function countOpenReports(): Promise<number> {
  try {
    const stats = await apiFetch<{ open: number }>("/admin/reports/stats");
    return stats.open;
  } catch (error) {
    return rethrowUnexpected(error, 0);
  }
}

async function countScheduled(): Promise<number> {
  try {
    const page = await apiFetch<Paginated<unknown>>("/admin/communications", {
      query: { status: "scheduled", per_page: 1 },
    });
    return page.pagination.total;
  } catch (error) {
    return rethrowUnexpected(error, 0);
  }
}

async function countWithdrawalRequests(): Promise<number> {
  try {
    const stats = await apiFetch<{ awaiting_review: number }>("/admin/withdrawals/stats");
    return stats.awaiting_review;
  } catch (error) {
    return rethrowUnexpected(error, 0);
  }
}

async function countNeedingDispatch(): Promise<number> {
  try {
    const page = await apiFetch<Paginated<unknown>>("/admin/orders/needs-dispatch", {
      query: { per_page: 1 },
    });
    return page.pagination.total;
  } catch (error) {
    return rethrowUnexpected(error, 0);
  }
}

/**
 * Applications that are *complete* and waiting on a decision.
 *
 * `stats.awaiting_review` counts every pending_review rider, including the ones
 * who registered and never finished onboarding - which is a different screen
 * and a different job, so the badge asks the list endpoint instead.
 */
async function countRiderRequests(): Promise<number> {
  try {
    const page = await apiFetch<Paginated<unknown>>("/admin/riders", {
      query: { status: "pending_review", is_profile_complete: 1, per_page: 1 },
    });
    return page.pagination.total;
  } catch (error) {
    return rethrowUnexpected(error, 0);
  }
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
