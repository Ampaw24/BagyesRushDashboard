import { cache } from "react";

import { apiFetch, apiFetchOptional } from "../api/client";
import type {
  AdminProfileDto,
  ManagedRoleDto,
  ManagedRolesResponseDto,
  RolesResponseDto,
  SyncDefaultsResponseDto,
} from "../types/api";
import type { AdminRole, Permission } from "../types/enums";

/**
 * The signed-in admin, including the permission list the whole dashboard gates
 * on. Wrapped in React's `cache` so the layout and any page that needs to check
 * a permission share one request per render.
 */
export const getAdminProfile = cache(async (): Promise<AdminProfileDto> => {
  return apiFetch<AdminProfileDto>("/admin/me");
});

/**
 * The role → permission matrix and the grouped permission catalogue, both from
 * one endpoint. Read-only: roles are a PHP enum, not database rows, so there is
 * no endpoint to edit them.
 */
export const getRoles = cache(async (): Promise<RolesResponseDto> => {
  return apiFetch<RolesResponseDto>("/admin/roles");
});

// --- Managing what each role may do -----------------------------------------

/**
 * GET /admin/roles/manage — requires `users.assign_role`, so super admin only.
 *
 * Distinct from `getRoles()`, which every admin may read to discover its own
 * capabilities. This one carries the editing metadata as well.
 */
export async function getManagedRoles(): Promise<ManagedRolesResponseDto | null> {
  // Null when the backend predates role editing, so the page can fall back to
  // the read-only view rather than showing an error for a missing feature.
  return apiFetchOptional<ManagedRolesResponseDto>("/admin/roles/manage");
}

/**
 * PUT /admin/roles/{role}/permissions
 *
 * The whole set is sent, not a delta: two admins editing at once would
 * otherwise interleave into a matrix neither of them chose.
 */
export async function updateRolePermissions(
  role: AdminRole,
  permissions: Permission[],
): Promise<ManagedRoleDto> {
  return apiFetch<ManagedRoleDto>(`/admin/roles/${role}/permissions`, {
    method: "PUT",
    body: { permissions },
  });
}

/** POST /admin/roles/{role}/reset — back to the enum baseline. */
export async function resetRolePermissions(role: AdminRole): Promise<ManagedRoleDto> {
  return apiFetch<ManagedRoleDto>(`/admin/roles/${role}/reset`, { method: "POST" });
}

/**
 * POST /admin/roles/sync-defaults
 *
 * "We shipped a module and nobody can see it": grants every customised role the
 * permissions its baseline gained, and takes nothing away.
 */
export async function syncRoleDefaults(): Promise<SyncDefaultsResponseDto> {
  return apiFetch<SyncDefaultsResponseDto>("/admin/roles/sync-defaults", { method: "POST" });
}
