"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  activateRiderAgreement,
  createRiderAgreement,
  deleteRiderAgreement,
  listRiderAgreementSignatories,
  updateRiderAgreement,
} from "@/lib/services/rider-agreements.service";

const ROUTE = "/dashboard/settings/rider-agreement";

/**
 * Publishing the contract riders sign.
 *
 * Both writes pass `FormData` straight through: each carries a PDF and has to
 * go out as multipart, so the client never reconstructs the body.
 */

/**
 * The riders who signed one version, a page at a time.
 *
 * Read through an action rather than the page because it is opened from the
 * count in one row - the list would otherwise fetch every version's riders up
 * front to show one dialog.
 */
export async function loadSignatoriesAction(id: number, page = 1, search = "") {
  return apiAction("Signatories loaded", async () => {
    const result = await listRiderAgreementSignatories(id, {
      page,
      per_page: 50,
      ...(search.trim() ? { search: search.trim() } : {}),
    });

    return {
      total: result.pagination.total,
      hasMore: result.pagination.has_more,
      items: result.items.map((dto) => ({
        id: dto.id,
        name: dto.name,
        phone: dto.phone,
        photoUrl: dto.photo_url,
        status: dto.status,
        acceptedAt: dto.accepted_at,
      })),
    };
  });
}

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
