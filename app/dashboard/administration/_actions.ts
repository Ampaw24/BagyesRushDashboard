"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import { revokeSession } from "@/lib/services/security.service";

/**
 * Sign somebody else out.
 *
 * Refused by the API for the caller's own current session — revoking the
 * session you are reading the screen on looks like the dashboard breaking, and
 * the sign-out button is what that person actually wants.
 */
export async function revokeSessionAction(id: number) {
  return apiAction("Session signed out", async () => {
    await revokeSession(id);
    revalidatePath("/dashboard/administration/sessions");
  });
}
