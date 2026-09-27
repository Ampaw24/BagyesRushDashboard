import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { AuthEventDto, SecuritySummaryDto, SessionDto } from "../types/api";

export type AuthEventQuery = {
  page?: number;
  per_page?: number;
  user_id?: number;
  event?: string;
  ip?: string;
  search?: string;
  /** Failures and lockouts only — how somebody reads this when suspicious. */
  concerning?: boolean;
  staff_only?: boolean;
  from?: string;
  to?: string;
};

/**
 * GET /admin/security/events — requires `audit.view`.
 *
 * Behind the same permission as the activity log, and for the same reason: a
 * support agent who can read a customer's profile has no business reading
 * everybody's sign-in addresses.
 */
export async function listAuthEvents(query: AuthEventQuery): Promise<Paginated<AuthEventDto>> {
  return apiFetchPage<AuthEventDto>("/admin/security/events", { query });
}

/** GET /admin/security/summary — the last 24 hours, for the stat tiles. */
export async function getSecuritySummary(): Promise<SecuritySummaryDto> {
  return apiFetch<SecuritySummaryDto>("/admin/security/summary");
}

/**
 * GET /admin/security/sessions — staff sessions that are open right now.
 *
 * Not paginated: there are as many rows as there are staff devices, and a
 * security screen that hides half of them behind a page break is worse than
 * one long list.
 */
export async function listSessions(userId?: number): Promise<SessionDto[]> {
  return apiFetch<SessionDto[]>("/admin/security/sessions", {
    query: userId ? { user_id: userId } : {},
  });
}

/** DELETE /admin/security/sessions/{id} — requires `users.manage`. */
export async function revokeSession(id: number): Promise<null> {
  return apiFetch<null>(`/admin/security/sessions/${id}`, { method: "DELETE" });
}
