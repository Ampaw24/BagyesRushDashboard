"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  activateRiderAgreement,
  createRiderAgreement,
  deleteRiderAgreement,
  updateRiderAgreement,
} from "@/lib/services/rider-agreements.service";

const ROUTE = "/dashboard/settings/rider-agreement";

/**
 * Publishing the contract riders sign.
 *
 * Both writes pass `FormData` straight through: each carries a PDF and has to
 * go out as multipart, so the client never reconstructs the body.
 */

export async function saveRiderAgreementAction(id: number | null, form: FormData) {
  return apiAction(id === null ? "Agreement saved" : "Agreement updated", async () => {
    if (id === null) await createRiderAgreement(form);
    else await updateRiderAgreement(id, form);

    revalidatePath(ROUTE);
  });
}

/**
 * Publish this version. The backend retires whatever it replaces in the same
 * transaction, so there is no matching "deactivate".
 */
export async function activateRiderAgreementAction(id: number) {
  return apiAction("Agreement published", async () => {
    await activateRiderAgreement(id);
    revalidatePath(ROUTE);
  });
}

export async function deleteRiderAgreementAction(id: number) {
  // 422 when it is in force or any rider has signed it — the API says which.
  return apiAction("Agreement deleted", async () => {
    await deleteRiderAgreement(id);
    revalidatePath(ROUTE);
  });
}
