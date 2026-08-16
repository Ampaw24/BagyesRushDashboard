import type { AdminProfileDto } from "../types/api";
import { adminRoleLabels, type AdminRole, type Permission } from "../types/enums";
import { toDate } from "./dates";

/**
 * The signed-in admin, as the chrome needs it.
 *
 * `GET /admin/me` carries no display name — the users table only has an email
 * and a phone — so the email is shown verbatim rather than inventing a name
 * from it.
 */
export type SessionAdmin = {
  id: number;
  email: string;
  /** What the topbar shows. The email is the only human-readable identifier. */
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
    name: dto.email,
    role: dto.role,
    roleLabel: dto.role_label ?? (dto.role ? adminRoleLabels[dto.role] : "Administrator"),
    isSuperAdmin: dto.is_super_admin,
    permissions: dto.permissions,
    lastLoginAt: toDate(dto.last_login_at),
  };
}
