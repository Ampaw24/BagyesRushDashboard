"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  getReport,
  updateReportStatus,
  type UpdateReportStatusInput,
} from "@/lib/services/reports.service";
import { toReportRow, type ReportRow } from "@/lib/mappers/report.mapper";
import { can, getPermissions } from "@/lib/auth/guard";

export type ReportQuickView = {
  report: ReportRow;
  canManage: boolean;
};

/**
 * One complaint for the quick-view dialog.
 *
 * Re-read rather than taken from the list row: the attachment URLs are
 * short-lived signed links, and the ones on a list loaded a while ago may
 * already have expired.
 */
export async function loadReportQuickViewAction(id: number) {
  return apiAction<ReportQuickView>("Report retrieved", async () => {
    const [permissions, report] = await Promise.all([getPermissions(), getReport(id)]);

    return { report: toReportRow(report), canManage: can(permissions, "reports.manage") };
  });
}

/**
 * Complaint triage.
 *
 * Closing one requires a note because that note is what the reporter is shown —
 * a status change with no explanation is worse than no reply. The backend
 * enforces it; this only carries the session cookie.
 */
export async function updateReportStatusAction(id: number, input: UpdateReportStatusInput) {
  return apiAction("Report updated", async () => {
    await updateReportStatus(id, input);
    revalidatePath("/dashboard/support");
    revalidatePath(`/dashboard/support/${id}`);
  });
}
