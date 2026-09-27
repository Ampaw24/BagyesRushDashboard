import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { ComplianceLogDto, ComplianceSummaryDto } from "../types/api";

export type ComplianceLogQuery = {
  page?: number;
  per_page?: number;
  status?: string;
  /**
   * Failed, unverified and partly verified in one filter — which is how somebody
   * actually opens this screen, and not expressible as a single status.
   */
  needs_attention?: boolean;
  order_id?: number;
  search?: string;
};

/**
 * GET /admin/compliance/logs — requires `orders.view`.
 *
 * Deliveries as filed with the Postal and Courier Services Regulatory Commission.
 * One row per delivery rather than per order: a parcel run with three drops is
 * three separate filings, each with its own recipient to verify.
 */
export async function listComplianceLogs(
  query: ComplianceLogQuery,
): Promise<Paginated<ComplianceLogDto>> {
  return apiFetchPage<ComplianceLogDto>("/admin/compliance/logs", { query });
}

/** GET /admin/compliance/summary — the stat tiles. */
export async function getComplianceSummary(): Promise<ComplianceSummaryDto> {
  return apiFetch<ComplianceSummaryDto>("/admin/compliance/summary");
}

/**
 * POST /admin/compliance/logs/{id}/retry — requires `settings.manage`.
 *
 * Only accepted from a state where re-sending could change the answer. Re-filing
 * something the Commission already has would either duplicate the register entry
 * or be refused for it, and the API answers 422 rather than pretending.
 */
export async function retryComplianceLog(id: number): Promise<ComplianceLogDto> {
  return apiFetch<ComplianceLogDto>(`/admin/compliance/logs/${id}/retry`, { method: "POST" });
}
