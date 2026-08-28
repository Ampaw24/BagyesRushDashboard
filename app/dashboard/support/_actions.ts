"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import { updateReportStatus, type UpdateReportStatusInput } from "@/lib/services/reports.service";

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
