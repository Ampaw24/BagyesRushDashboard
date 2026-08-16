import type { AdminUserRow } from "@/lib/mappers/admin-user.mapper";
import type { AdminRole } from "@/lib/types/enums";

/**
 * Client-side hints only.
 *
 * The backend is the real enforcer here: AdminUserService refuses to suspend or
 * demote the last super administrator, refuses self-suspension, and refuses
 * self-role-changes, returning a 422 with the reason. These helpers exist so
 * the menu can disable an option with an explanation instead of offering a
 * click that is guaranteed to fail.
 */

export function isLastActiveSuperAdmin(
  target: Pick<AdminUserRow, "adminRole" | "status">,
  activeSuperAdminCount: number,
): boolean {
  return (
    target.adminRole === "super_admin" && target.status === "active" && activeSuperAdminCount <= 1
  );
}

export function canSuspendAdmin(
  target: Pick<AdminUserRow, "id" | "adminRole" | "status">,
  currentAdminId: number,
  activeSuperAdminCount: number,
): { allowed: boolean; reason?: string } {
  if (target.id === currentAdminId) {
    return { allowed: false, reason: "You cannot suspend yourself." };
  }
  if (isLastActiveSuperAdmin(target, activeSuperAdminCount)) {
    return {
      allowed: false,
      reason: "The last super administrator cannot be suspended. Promote someone else first.",
    };
  }
  return { allowed: true };
}

export function canChangeRole(
  target: Pick<AdminUserRow, "id" | "adminRole" | "status">,
  currentAdminId: number,
  activeSuperAdminCount: number,
): { allowed: boolean; reason?: string } {
  if (target.id === currentAdminId) {
    return { allowed: false, reason: "You cannot change your own role." };
  }
  if (isLastActiveSuperAdmin(target, activeSuperAdminCount)) {
    return {
      allowed: false,
      reason: "The last super administrator cannot be demoted. Promote someone else first.",
    };
  }
  return { allowed: true };
}

/** Only an `admin` account can hold a staff role — the backend rejects anything else. */
export function canHoldAdminRole(target: Pick<AdminUserRow, "role">): boolean {
  return target.role === "admin";
}

export type { AdminRole };
