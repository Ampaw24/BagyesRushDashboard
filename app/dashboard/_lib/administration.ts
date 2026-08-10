import type { AdminRole, AdminUser } from "../_services/mock-data";
import type { AuditAction } from "../_services/administration-mock-data";

// UI-level guard only — there is no backend in this app to enforce this for
// real. It exists so the dashboard demonstrates the business rule rather
// than silently allowing it.
export function isLastActiveSuperAdmin(target: Pick<AdminUser, "role" | "status">, activeSuperAdminCount: number): boolean {
  return target.role === "super_admin" && target.status === "active" && activeSuperAdminCount <= 1;
}

// UI-level guard only — see isLastActiveSuperAdmin.
export function canRemoveAdmin(target: Pick<AdminUser, "role" | "status">, activeSuperAdminCount: number): boolean {
  return !isLastActiveSuperAdmin(target, activeSuperAdminCount);
}

// UI-level guard only — see isLastActiveSuperAdmin. An admin can't escalate
// a target to Super Admin, and can't modify a Super Admin target at all;
// only a Super Admin actor can do either.
export function canChangeRole(actorRole: AdminRole, targetRole: AdminRole, newRole: AdminRole): boolean {
  if (actorRole === "super_admin") return true;
  if (targetRole === "super_admin") return false;
  if (newRole === "super_admin") return false;
  return true;
}

export const auditActionMeta: Record<AuditAction, { label: string }> = {
  ADMIN_CREATED: { label: "Admin created" },
  ADMIN_ROLE_CHANGED: { label: "Admin role changed" },
  ADMIN_SUSPENDED: { label: "Admin suspended" },
  ADMIN_REACTIVATED: { label: "Admin reactivated" },
  ADMIN_REMOVED: { label: "Admin access removed" },
  USER_ROLE_CHANGED: { label: "User role changed" },
  VENDOR_CREATED: { label: "Vendor created" },
  VENDOR_UPDATED: { label: "Vendor updated" },
  VENDOR_SUSPENDED: { label: "Vendor suspended" },
  VENDOR_ACTIVATED: { label: "Vendor activated" },
  VENDOR_ARCHIVED: { label: "Vendor archived" },
  VENDOR_VERIFIED: { label: "Vendor verified" },
  VENDOR_REJECTED: { label: "Vendor rejected" },
};
