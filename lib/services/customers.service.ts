import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { AdminCustomerDto, CustomerDetailDto } from "../types/api";
import type { UserStatus } from "../types/enums";

export type CustomerListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  /** Filtered on the linked user account, not the customer row. */
  status?: UserStatus;
};

/** GET /admin/customers — requires `customers.view`. List rows carry `orders_count`. */
export async function listCustomers(query: CustomerListQuery): Promise<Paginated<AdminCustomerDto>> {
  return apiFetchPage<AdminCustomerDto>("/admin/customers", { query });
}

/** Detail adds a spend/orders summary but drops `orders_count`. */
export async function getCustomer(id: number): Promise<CustomerDetailDto> {
  return apiFetch<CustomerDetailDto>(`/admin/customers/${id}`);
}

/** Requires `customers.suspend`. `reason` must be 5–255 characters. */
export async function suspendCustomer(id: number, reason: string): Promise<AdminCustomerDto> {
  return apiFetch<AdminCustomerDto>(`/admin/customers/${id}/suspend`, {
    method: "PATCH",
    body: { reason },
  });
}

export async function reinstateCustomer(id: number): Promise<AdminCustomerDto> {
  return apiFetch<AdminCustomerDto>(`/admin/customers/${id}/reinstate`, { method: "PATCH" });
}
