import { getAdminProfile } from "../services/profile.service";
import type { Permission } from "../types/enums";

/**
 * Permission checks for Server Components.
 *
 * These mirror `User::hasPermission()`: the backend is still the enforcer, and
 * every guarded route re-checks on its own. The point of checking here is to
 * avoid rendering a screen or an action that is guaranteed to 403 on click.
 */

export function can(permissions: readonly Permission[], permission: Permission): boolean {
  return permissions.includes(permission);
}

export function canAny(permissions: readonly Permission[], required: readonly Permission[]): boolean {
  return required.some((permission) => permissions.includes(permission));
}

/** Convenience for pages that need the permission list and nothing else. */
export async function getPermissions(): Promise<Permission[]> {
  const profile = await getAdminProfile();
  return profile.permissions;
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  return can(await getPermissions(), permission);
}
