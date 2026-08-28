import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { ReportDto, ReportStatsDto } from "../types/api";
import type { ReportStatus, ReportTargetType } from "../types/enums";

export type ReportListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: ReportStatus;
  target_type?: ReportTargetType;
  reporter_role?: string;
  from?: string;
  to?: string;
};

/**
 * GET /admin/reports — requires `reports.view`.
 *
 * Open complaints come back first: this is a work queue before it is an
 * archive, and one nobody has looked at is the reason the screen exists.
 */
export async function listReports(query: ReportListQuery): Promise<Paginated<ReportDto>> {
  return apiFetchPage<ReportDto>("/admin/reports", { query });
}

/** GET /admin/reports/stats — requires `reports.view`. */
export async function getReportStats(): Promise<ReportStatsDto> {
  return apiFetch<ReportStatsDto>("/admin/reports/stats");
}

/** GET /admin/reports/{id} — requires `reports.view`. */
export async function getReport(id: number): Promise<ReportDto> {
  return apiFetch<ReportDto>(`/admin/reports/${id}`);
}

export type UpdateReportStatusInput = {
  status: ReportStatus;
  /** Required when closing one: it is what the reporter is shown. */
  resolution_note?: string | null;
};

/** PATCH /admin/reports/{id}/status — requires `reports.manage`. */
export async function updateReportStatus(
  id: number,
  input: UpdateReportStatusInput,
): Promise<ReportDto> {
  return apiFetch<ReportDto>(`/admin/reports/${id}/status`, { method: "PATCH", body: input });
}
