"use server";

import { apiAction } from "@/lib/api/action";
import { changeOwnPassword, type ChangePasswordInput } from "@/lib/services/account.service";

/**
 * Change the signed-in admin's own password.
 *
 * No `revalidatePath`: nothing rendered on the page changes, and the one thing
 * that does — every other session being revoked — is not something this tab can
 * show anyway.
 */
export async function changePasswordAction(input: ChangePasswordInput) {
  return apiAction("Password changed. Your other devices have been signed out.", async () => {
    await changeOwnPassword(input);
  });
}
