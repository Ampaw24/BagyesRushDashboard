import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { RiderAgreementDto } from "../types/api";

/**
 * The rider agreement, as published documents.
 *
 * Not reference data: there is no toggle, because you do not deactivate a
 * contract, you replace it. `activateRiderAgreement` retires whatever it
 * supersedes in the same transaction on the backend, so exactly one is ever in
 * force.
 *
 * Create and update are multipart — both carry a PDF — which is why update is
 * POST rather than PUT, the same as categories and banners.
 */

export type RiderAgreementListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
};

export async function listRiderAgreements(
  query: RiderAgreementListQuery,
): Promise<Paginated<RiderAgreementDto>> {
  return apiFetchPage<RiderAgreementDto>("/admin/rider-agreements", { query });
}

export async function getRiderAgreement(id: number): Promise<RiderAgreementDto> {
  return apiFetch<RiderAgreementDto>(`/admin/rider-agreements/${id}`);
}

export async function createRiderAgreement(form: FormData): Promise<RiderAgreementDto> {
  return apiFetch<RiderAgreementDto>("/admin/rider-agreements", { method: "POST", formData: form });
}

/** POST, not PUT: it carries a PDF, and multipart does not survive PUT. */
export async function updateRiderAgreement(id: number, form: FormData): Promise<RiderAgreementDto> {
  return apiFetch<RiderAgreementDto>(`/admin/rider-agreements/${id}`, { method: "POST", formData: form });
}

export async function deleteRiderAgreement(id: number): Promise<null> {
  return apiFetch<null>(`/admin/rider-agreements/${id}`, { method: "DELETE" });
}

/** Publish this version, retiring the one it replaces. */
export async function activateRiderAgreement(id: number): Promise<RiderAgreementDto> {
  return apiFetch<RiderAgreementDto>(`/admin/rider-agreements/${id}/activate`, { method: "PATCH" });
}
