"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  createRole,
  deleteRole,
  resetRolePermissions,
  syncRoleDefaults,
  updateRole,
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
  // Role pickers on the staff screens read the role list too.
  revalidatePath("/dashboard/admin-users");
  revalidatePath("/dashboard", "layout");
}

/** A new role, ready to assign the moment it exists. */
export async function createRoleAction(input: {
  name: string;
  description?: string;
  permissions: Permission[];
}) {
  return apiAction("Role created", async () => {
    const role = await createRole(input);
    revalidateRoleViews();

    return { value: role.value };
  });
}

/** Renames a custom role. Everyone holding it keeps it. */
export async function updateRoleAction(
  role: AdminRole,
  input: { name: string; description: string | null },
) {
  return apiAction("Role updated", async () => {
    await updateRole(role, input);
    revalidateRoleViews();
  });
}

/** Refused by the backend while any staff account still holds the role. */
export async function deleteRoleAction(role: AdminRole) {
  return apiAction("Role deleted", async () => {
    await deleteRole(role);
    revalidateRoleViews();
  });
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
