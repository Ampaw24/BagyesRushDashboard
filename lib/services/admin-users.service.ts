import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { AdminUserDto, StaffCredentialsDto } from "../types/api";
import type { AdminRole, UserRole, UserStatus } from "../types/enums";

export type UserListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  role?: UserRole;
  admin_role?: AdminRole;
  status?: UserStatus;
};

/** GET /admin/users — requires `users.view`. Covers every role, not just staff. */
export async function listUsers(query: UserListQuery): Promise<Paginated<AdminUserDto>> {
  return apiFetchPage<AdminUserDto>("/admin/users", { query });
}

export async function getUser(id: number): Promise<AdminUserDto> {
  return apiFetch<AdminUserDto>(`/admin/users/${id}`);
}

/**
 * Requires `users.manage`. This endpoint creates staff only — public
 * registration is the only path to a customer or vendor account.
 *
 * The returned password is shown once and cannot be retrieved again.
 */
export async function createStaff(input: {
  email: string;
  phone: string;
  password?: string;
  admin_role: AdminRole;
}): Promise<StaffCredentialsDto> {
  return apiFetch<StaffCredentialsDto>("/admin/users", { method: "POST", body: input });
}

export async function updateUser(
  id: number,
  input: { email?: string; phone?: string },
): Promise<AdminUserDto> {
  return apiFetch<AdminUserDto>(`/admin/users/${id}`, { method: "PUT", body: input });
}

/**
 * Requires `users.manage`. `reason` must be 5–255 characters.
 * The backend refuses self-suspension and suspending the last super admin.
 */
export async function suspendUser(id: number, reason: string): Promise<AdminUserDto> {
  return apiFetch<AdminUserDto>(`/admin/users/${id}/suspend`, { method: "PATCH", body: { reason } });
}

export async function reinstateUser(id: number): Promise<AdminUserDto> {
  return apiFetch<AdminUserDto>(`/admin/users/${id}/reinstate`, { method: "PATCH" });
}

/** Returns the new password, shown once. */
export async function resetUserPassword(
  id: number,
  password?: string,
): Promise<StaffCredentialsDto> {
  return apiFetch<StaffCredentialsDto>(`/admin/users/${id}/reset-password`, {
    method: "POST",
    body: password ? { password } : {},
  });
}

/**
 * Requires `users.assign_role` — super admin only. Signs out the target's
 * existing sessions, and refuses demoting the last super admin.
 */
export async function assignAdminRole(id: number, adminRole: AdminRole): Promise<AdminUserDto> {
  return apiFetch<AdminUserDto>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: { admin_role: adminRole },
  });
}
