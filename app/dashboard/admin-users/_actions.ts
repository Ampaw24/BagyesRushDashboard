"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  assignAdminRole,
  createStaff,
  reinstateUser,
  resetUserPassword,
  suspendUser,
  updateUser,
} from "@/lib/services/admin-users.service";
import { listActivity } from "@/lib/services/activity.service";
import { toActivityRow, type ActivityRow } from "@/lib/mappers/activity.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import type { AdminRole } from "@/lib/types/enums";

/**
 * The latest entries in one admin's audit trail, for the quick view.
 *
 * Null rather than an error without `audit.view` — only super admins and
 * finance hold it, and the dialog simply leaves the section out.
 */
export async function loadAdminActivityAction(id: number) {
  return apiAction<{ items: ActivityRow[]; total: number } | null>(
    "Activity retrieved",
    async () => {
      if (!can(await getPermissions(), "audit.view")) return null;

      const page = await listActivity({ admin_id: id, per_page: 10 });
      return { items: page.items.map(toActivityRow), total: page.pagination.total };
    },
  );
}

/**
 * Staff account management.
 *
 * Several of these return a one-time password. It is never retrievable again,
 * so the action passes it back to the caller to display rather than discarding
 * it after the request.
 */
function revalidateAdminViews(id?: number) {
  revalidatePath("/dashboard/admin-users");
  if (id !== undefined) revalidatePath(`/dashboard/administration/admins/${id}`);
}

export async function createStaffAction(input: {
  name?: string;
  email: string;
  phone: string;
  password?: string;
  admin_role: AdminRole;
}) {
  return apiAction("Staff account created", async () => {
    const created = await createStaff(input);
    revalidateAdminViews();
    return { id: created.user.id, password: created.password };
  });
}

export async function updateAdminUserAction(
  id: number,
  input: { name?: string | null; email?: string; phone?: string },
) {
  return apiAction("Account updated", async () => {
    await updateUser(id, input);
    revalidateAdminViews(id);
  });
}

/** `reason` must be 5–255 characters. */
export async function suspendAdminUserAction(id: number, reason: string) {
  return apiAction("Account suspended", async () => {
    await suspendUser(id, reason);
    revalidateAdminViews(id);
  });
}

export async function reinstateAdminUserAction(id: number) {
  return apiAction("Account reinstated", async () => {
    await reinstateUser(id);
    revalidateAdminViews(id);
  });
}

export async function resetAdminPasswordAction(id: number) {
  return apiAction("Password reset", async () => {
    const result = await resetUserPassword(id);
    revalidateAdminViews(id);
    return { password: result.password };
  });
}

/** Requires `users.assign_role` — super administrator only. */
export async function assignAdminRoleAction(id: number, role: AdminRole) {
  return apiAction("Role updated", async () => {
    await assignAdminRole(id, role);
    revalidateAdminViews(id);
  });
}
