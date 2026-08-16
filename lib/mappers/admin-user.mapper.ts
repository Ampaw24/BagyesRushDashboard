import type { AdminUserDto } from "../types/api";
import { adminRoleLabels, type AdminRole, type UserRole, type UserStatus } from "../types/enums";
import { toDate, toDateOrEpoch } from "./dates";

export type AdminUserRow = {
  id: number;
  email: string;
  phone: string;
  /** The users table has no name column — this is the email or the linked profile's name. */
  displayName: string;
  role: UserRole;
  adminRole: AdminRole | null;
  adminRoleLabel: string;
  status: UserStatus;
  isActive: boolean;
  phoneVerified: boolean;
  profileType: "customer" | "vendor" | null;
  profileLabel: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
};

export function toAdminUserRow(dto: AdminUserDto): AdminUserRow {
  return {
    id: dto.id,
    email: dto.email,
    phone: dto.phone,
    displayName: dto.display_name,
    role: dto.role,
    adminRole: dto.admin_role,
    adminRoleLabel:
      dto.admin_role_label ?? (dto.admin_role ? adminRoleLabels[dto.admin_role] : "—"),
    status: dto.status,
    isActive: dto.is_active,
    phoneVerified: dto.phone_verified,
    profileType: dto.profile?.type ?? null,
    profileLabel:
      dto.profile?.type === "customer"
        ? `${dto.profile.first_name} ${dto.profile.last_name}`
        : dto.profile?.type === "vendor"
          ? dto.profile.business_name
          : null,
    lastLoginAt: toDate(dto.last_login_at),
    createdAt: toDateOrEpoch(dto.created_at),
  };
}
