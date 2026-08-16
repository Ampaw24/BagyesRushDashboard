import { cache } from "react";

import { apiFetch } from "../api/client";
import type { AdminProfileDto, RolesResponseDto } from "../types/api";

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
