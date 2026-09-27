"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import { retryComplianceLog } from "@/lib/services/compliance.service";

/**
 * Send a failed filing to the Commission again.
 *
 * Refused by the API from any state where it is already on file: re-filing
 * something iCOLMS has would either duplicate the register entry or be rejected
 * for it. The 422 message is the API's own, so the screen says what happened
 * rather than guessing.
 */
export async function retryComplianceLogAction(id: number) {
  return apiAction("Queued for filing again", async () => {
    await retryComplianceLog(id);
    revalidatePath("/dashboard/administration/compliance");
  });
}
