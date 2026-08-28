"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  previewPlatformSettings,
  publishPlatformSettings,
  type PlatformSettingInput,
} from "@/lib/services/platform-settings.service";
import type { SettingsPreviewDto } from "@/lib/types/api";

/**
 * Every price and every payout on the platform.
 *
 * Behind `settings.manage` on the backend — its own permission, because
 * editing a menu and setting the commission on every order are not the same
 * authority.
 */
export async function previewSettingsAction(input: PlatformSettingInput) {
  return apiAction<SettingsPreviewDto>("", async () => previewPlatformSettings(input));
}

export async function publishSettingsAction(input: PlatformSettingInput) {
  return apiAction("Settings published", async () => {
    await publishPlatformSettings(input);

    // Pricing shows up on nearly every money screen, so the whole shell
    // redraws rather than one page.
    revalidatePath("/dashboard", "layout");
  });
}
