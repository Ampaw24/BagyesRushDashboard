import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { AdminOrderDto, OrderStatsDto } from "../types/api";
import type { OrderStatus, PaymentStatus } from "../types/enums";

export type OrderListQuery = {
  page?: number;
  per_page?: number;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  search?: string;
  vendor_id?: number;
  customer_id?: number;
  from?: string;
  to?: string;
};

/**
 * GET /admin/orders — requires `orders.view`.
 * Ordered by id descending, server-side; there is no sort parameter.
 */
export async function listOrders(query: OrderListQuery): Promise<Paginated<AdminOrderDto>> {
  return apiFetchPage<AdminOrderDto>("/admin/orders", { query });
}

export async function getOrderStats(): Promise<OrderStatsDto> {
  return apiFetch<OrderStatsDto>("/admin/orders/stats");
}

export async function getOrder(id: number): Promise<AdminOrderDto> {
  return apiFetch<AdminOrderDto>(`/admin/orders/${id}`);
}

/**
 * Requires `orders.update_status`. The backend re-checks the transition, so an
 * illegal jump is a 422 even if the UI somehow offered it.
 * `reason` lands on rejection_reason for `rejected`, cancellation_reason otherwise.
 */
export async function updateOrderStatus(
  id: number,
  status: OrderStatus,
  reason?: string,
): Promise<AdminOrderDto> {
  return apiFetch<AdminOrderDto>(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: { status, ...(reason ? { reason } : {}) },
  });
}

/** Requires `orders.assign_rider`. The rider must be an active `delivery` user. */
export async function assignRider(id: number, riderId: number): Promise<AdminOrderDto> {
  return apiFetch<AdminOrderDto>(`/admin/orders/${id}/assign-rider`, {
    method: "PATCH",
    body: { rider_id: riderId },
  });
}

/** Requires `payments.refund` — moving money is a payments permission, not an orders one. */
export async function refundOrder(id: number): Promise<AdminOrderDto> {
  return apiFetch<AdminOrderDto>(`/admin/orders/${id}/refund`, { method: "PATCH" });
}
