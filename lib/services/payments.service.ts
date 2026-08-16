import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { AdminPaymentDto, PaymentStatsDto } from "../types/api";
import type { PaymentMethod, PaymentStatus } from "../types/enums";

export type PaymentListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  provider?: string;
  vendor_id?: number;
  customer_id?: number;
  from?: string;
  to?: string;
};

/**
 * GET /admin/payments — requires `payments.view`.
 *
 * This reads the payments table rather than deriving from orders, which is the
 * point: a payment that succeeded at the gateway against an order that never
 * settled is invisible on an orders-derived figure and visible here.
 */
export async function listPayments(query: PaymentListQuery): Promise<Paginated<AdminPaymentDto>> {
  return apiFetchPage<AdminPaymentDto>("/admin/payments", { query });
}

export async function getPaymentStats(): Promise<PaymentStatsDto> {
  return apiFetch<PaymentStatsDto>("/admin/payments/stats");
}

export async function getPayment(id: number): Promise<AdminPaymentDto> {
  return apiFetch<AdminPaymentDto>(`/admin/payments/${id}`);
}

/** Requires `payments.verify`. Re-checks the attempt against the gateway. */
export async function verifyPayment(id: number): Promise<AdminPaymentDto> {
  return apiFetch<AdminPaymentDto>(`/admin/payments/${id}/verify`, { method: "POST" });
}
