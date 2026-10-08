import type { AdminProfileDto } from "../types/api";
import { adminRoleLabels, type AdminRole, type Permission } from "../types/enums";
import { toDate } from "./dates";

/**
 * The signed-in admin, as the chrome needs it.
 *
 * The staff name when one has been set, otherwise the email verbatim rather
 * than a name invented from it.
 */
export type SessionAdmin = {
  id: number;
  email: string;
  /** What the topbar shows: the staff name, or the email when none is set. */
  name: string;
  role: AdminRole | null;
  roleLabel: string;
  isSuperAdmin: boolean;
  permissions: Permission[];
  lastLoginAt: Date | null;
};

export function toSessionAdmin(dto: AdminProfileDto): SessionAdmin {
  return {
    id: dto.id,
    email: dto.email,
    name: dto.name || dto.email,
    role: dto.role,
    roleLabel: dto.role_label ?? (dto.role ? (adminRoleLabels[dto.role] ?? dto.role) : "Administrator"),
    isSuperAdmin: dto.is_super_admin,
    permissions: dto.permissions,
    lastLoginAt: toDate(dto.last_login_at),
  };
}
