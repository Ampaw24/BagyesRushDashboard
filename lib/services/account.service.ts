import { apiFetch } from "../api/client";

/**
 * The signed-in admin's own account.
 *
 * Distinct from `admin-users.service.ts`, which administers *other* people:
 * resetting somebody else's password is a staff action that revokes their
 * tokens and hands back a generated string, while this one needs the current
 * password and keeps the session that made the request alive.
 */

export type ChangePasswordInput = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

/**
 * POST /v1/password/change — any authenticated user, not just an admin.
 *
 * Knowing the current password is what proves the session was not simply left
 * open on a borrowed laptop. Every *other* token is revoked on success; the one
 * making the request survives, because being signed out of the screen you just
 * used to change your password is a bug rather than a security measure.
 */
export async function changeOwnPassword(input: ChangePasswordInput): Promise<void> {
  await apiFetch<null>("/password/change", { method: "POST", body: input });
}
