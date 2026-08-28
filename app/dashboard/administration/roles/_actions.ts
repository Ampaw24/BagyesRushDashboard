"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  resetRolePermissions,
  syncRoleDefaults,
  updateRolePermissions,
} from "@/lib/services/profile.service";
import type { AdminRole, Permission } from "@/lib/types/enums";

/**
 * Editing what each staff role may do.
 *
 * The backend gate is `users.assign_role` — super admin only — because granting
 * a capability weighs the same as granting a role. These wrappers only carry
 * the session cookie.
 *
 * Every path revalidates the dashboard layout as well as this page: the sidebar
 * is built from the signed-in admin's permissions, so changing your own role's
 * set has to redraw the nav or modules appear and disappear a navigation late.
 */
function revalidateRoleViews() {
  revalidatePath("/dashboard/administration/roles");
  revalidatePath("/dashboard/administration/permissions");
  revalidatePath("/dashboard", "layout");
}

export async function updateRolePermissionsAction(role: AdminRole, permissions: Permission[]) {
  return apiAction("Role updated", async () => {
    await updateRolePermissions(role, permissions);
    revalidateRoleViews();
  });
}

export async function resetRolePermissionsAction(role: AdminRole) {
  return apiAction("Role reset to its defaults", async () => {
    await resetRolePermissions(role);
    revalidateRoleViews();
  });
}

/** Grants each customised role whatever its baseline gained. Removes nothing. */
export async function syncRoleDefaultsAction() {
  return apiAction("Roles synced with their defaults", async () => {
    const result = await syncRoleDefaults();
    revalidateRoleViews();

    return result.added;
  });
}
