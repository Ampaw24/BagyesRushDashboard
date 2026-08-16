"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import { getCustomer, reinstateCustomer, suspendCustomer } from "@/lib/services/customers.service";
import { toCustomerDetail } from "@/lib/mappers/customer.mapper";

/**
 * Customer moderation. `/admin/customers` is read + suspend/reinstate only —
 * there is no endpoint to edit a customer's profile or delete them, so those
 * options are gone from the UI rather than faked.
 */

export async function suspendCustomerAction(id: number, reason: string) {
  return apiAction("Customer suspended", async () => {
    await suspendCustomer(id, reason);
    revalidatePath("/dashboard/users");
  });
}

export async function reinstateCustomerAction(id: number) {
  return apiAction("Customer reinstated", async () => {
    await reinstateCustomer(id);
    revalidatePath("/dashboard/users");
  });
}

/**
 * Loads the detail view on demand.
 *
 * Lifetime value and the order counts live only on `GET /admin/customers/{id}`
 * — the list response does not carry them — so the dialog fetches when it
 * opens rather than the table over-fetching for every row.
 */
export async function loadCustomerDetailAction(id: number) {
  return apiAction("Customer retrieved", async () => toCustomerDetail(await getCustomer(id)));
}
