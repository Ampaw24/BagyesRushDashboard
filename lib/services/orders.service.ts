import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { AdminOrderDto, OrderStatsDto } from "../types/api";
import type { OrderStatus, OrderType, PaymentStatus } from "../types/enums";

export type OrderListQuery = {
  page?: number;
  per_page?: number;
  status?: OrderStatus;
  /** Food or parcel. Omitted returns both — the board is one list. */
  type?: OrderType;
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

/**
 * GET /admin/orders/needs-dispatch — requires `dispatch.manage`.
 *
 * Orders every ring of the broadcast failed to place with a rider. Oldest
 * first: the customer who has been waiting longest is the one to sort out.
 */
export async function listOrdersNeedingDispatch(query: { per_page?: number } = {}): Promise<Paginated<AdminOrderDto>> {
  return apiFetchPage<AdminOrderDto>("/admin/orders/needs-dispatch", { query });
}

/**
 * GET /admin/orders/failed-deliveries — requires `orders.view`.
 *
 * A different queue from needs-dispatch, because it is a different
 * decision. That one lists orders with no rider and asks who can carry
 * them. These still *have* a rider — they waited out the countdown at the
 * door, nobody came, and they are holding the food — and the question is
 * refund, reassign or mark collected.
 */
export async function listFailedDeliveries(query: { per_page?: number } = {}): Promise<Paginated<AdminOrderDto>> {
  return apiFetchPage<AdminOrderDto>("/admin/orders/failed-deliveries", { query });
}

/**
 * GET /admin/orders/awaiting-vendor — requires `orders.view`.
 *
 * The third queue, and the one that had no screen. Needs-dispatch is "no rider
 * took it"; failed-deliveries is "the rider reached the door and could not hand
 * it over". This is neither: the customer has paid and the kitchen has simply
 * not answered, so the order never reaches dispatch at all — that does not
 * begin until `ready`.
 *
 * Oldest first, server-side, by `needs_vendor_chase_at`: an order only lands
 * here once the chase command has already reminded the vendor and escalated.
 */
export async function listOrdersAwaitingVendor(
  query: { per_page?: number } = {},
): Promise<Paginated<AdminOrderDto>> {
  return apiFetchPage<AdminOrderDto>("/admin/orders/awaiting-vendor", { query });
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

/**
 * Requires `orders.assign_rider`.
 *
 * The rider must be active *and* approved — assigning by hand is not a way
 * around the document check. Any outstanding offers on the order are withdrawn
 * and the riders holding them are told.
 */
export async function assignRider(id: number, riderId: number): Promise<AdminOrderDto> {
  return apiFetch<AdminOrderDto>(`/admin/orders/${id}/assign-rider`, {
    method: "PATCH",
    body: { rider_id: riderId },
  });
}

/** Requires `payments.refund` — moving money is a payments permission, not an orders one. */
/**
 * PATCH /admin/orders/{id}/refund — requires `payments.refund`.
 *
 * Both arguments are optional and both default the safe way: the whole
 * refundable remainder, back to the card or mobile money it came from. The
 * amount is capped server-side against what has already gone back, so two
 * refunds can never exceed the order.
 *
 * `destination: "wallet"` credits the customer instead of reversing at the
 * gateway — instant, and the only option at all when there is no gateway
 * payment to reverse. The backend silently falls back to it in that case rather
 * than failing, and says so in the audit line.
 */
export async function refundOrder(
  id: number,
  input: { amount?: number; destination?: "source" | "wallet"; reason?: string } = {},
): Promise<AdminOrderDto> {
  return apiFetch<AdminOrderDto>(`/admin/orders/${id}/refund`, { method: "PATCH", body: input });
}
