import { apiFetch } from "../api/client";
import type { DashboardDto } from "../types/api";

/**
 * GET /admin/dashboard — requires `dashboard.view`.
 *
 * The revenue, payments, promotions and top-vendor blocks are omitted entirely
 * unless the caller also holds `payments.view`, so the consuming page must
 * treat those keys as optional rather than assume zeroes.
 */
export async function getDashboard(): Promise<DashboardDto> {
  return apiFetch<DashboardDto>("/admin/dashboard");
}
