import { apiFetch, apiFetchOptional } from "../api/client";
import type { Paginated } from "../api/types";
import type { PayoutProviderDto } from "../types/api";
import type { PayoutProviderType } from "../types/enums";

export type PayoutProviderListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  type?: PayoutProviderType;
  is_active?: boolean;
};

/** GET /admin/payout-providers — requires `catalogue.manage`. Includes inactive. */
export async function listPayoutProviders(
  query: PayoutProviderListQuery,
): Promise<Paginated<PayoutProviderDto> | null> {
  // Null when the backend predates payout providers, so the page can say so
  // rather than rendering an error for a feature that has not shipped there.
  return apiFetchOptional<Paginated<PayoutProviderDto>>("/admin/payout-providers", { query });
}

export type PayoutProviderInput = {
  type: PayoutProviderType;
  name: string;
  short_name?: string | null;
  /** Paystack's bank code, so a transfer recipient can be created later. */
  code?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
  display_order?: number;
};

/**
 * A logo may be uploaded instead of linked.
 *
 * FormData when there is a file, JSON otherwise — the API accepts both, and
 * sending multipart for a plain rename would be wasteful.
 */
export async function createPayoutProvider(
  input: PayoutProviderInput | FormData,
): Promise<PayoutProviderDto> {
  return input instanceof FormData
    ? apiFetch<PayoutProviderDto>("/admin/payout-providers", { method: "POST", formData: input })
    : apiFetch<PayoutProviderDto>("/admin/payout-providers", { method: "POST", body: input });
}

/**
 * The slug is derived from the name on create and never changes — it is what
 * the seeder matches on, so a rename must not mint a new one.
 */
export async function updatePayoutProvider(
  id: number,
  input: Partial<PayoutProviderInput> | FormData,
): Promise<PayoutProviderDto> {
  // POST for multipart, like banners and categories: a browser cannot send a
  // multipart body as PUT.
  return input instanceof FormData
    ? apiFetch<PayoutProviderDto>(`/admin/payout-providers/${id}`, { method: "POST", formData: input })
    : apiFetch<PayoutProviderDto>(`/admin/payout-providers/${id}`, { method: "PUT", body: input });
}

/** Refused while any vendor or rider is paid through it. */
export async function deletePayoutProvider(id: number): Promise<null> {
  return apiFetch<null>(`/admin/payout-providers/${id}`, { method: "DELETE" });
}

export async function togglePayoutProviderStatus(id: number): Promise<PayoutProviderDto> {
  return apiFetch<PayoutProviderDto>(`/admin/payout-providers/${id}/toggle-status`, {
    method: "PATCH",
  });
}
