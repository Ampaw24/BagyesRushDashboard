import { apiFetch, apiFetchOptional } from "../api/client";
import type {
  PlatformSettingDto,
  PlatformSettingsResponseDto,
  ExportOptionsDto,
  SettingsPreviewDto,
} from "../types/api";

/**
 * Every money rule on the platform, in one versioned place.
 *
 * Every field is optional except the name: changing the commission does not
 * mean resending the delivery pricing, and anything omitted is carried forward
 * from whatever is in force.
 */
export type PlatformSettingInput = {
  name: string;

  delivery_base_fee?: number | null;
  delivery_free_km?: number | null;
  delivery_per_km?: number | null;
  delivery_max_km?: number | null;

  parcel_base_fee?: number | null;
  parcel_per_km?: number | null;
  parcel_pickup_per_km?: number | null;
  parcel_per_stop_fee?: number | null;
  parcel_fragile_surcharge?: number | null;

  service_fee_percent?: number | null;
  service_fee_flat?: number | null;
  service_fee_cap?: number | null;

  vendor_percent?: number | null;
  rider_percent?: number | null;
  parcel_rider_percent?: number | null;

  rider_minimum?: number | null;
  rider_minimum_withdrawal?: number | null;
  vendor_minimum_withdrawal?: number | null;
  customer_minimum_withdrawal?: number | null;
  customer_withdrawals_enabled?: boolean;
};

/**
 * GET /admin/platform-settings — requires `settings.manage`.
 *
 * Null when the backend predates settings, so the screen can say so rather
 * than erroring on a feature that has not shipped there.
 */
export async function getPlatformSettings(): Promise<PlatformSettingsResponseDto | null> {
  return apiFetchOptional<PlatformSettingsResponseDto>("/admin/platform-settings");
}

/**
 * What these rules would charge and pay, before they are published.
 *
 * Computed server-side by the same methods that run at checkout — so the
 * number an admin approves is the number a customer is charged, not a second
 * implementation of the arithmetic in TypeScript.
 */
export async function previewPlatformSettings(
  input: PlatformSettingInput,
): Promise<SettingsPreviewDto> {
  return apiFetch<SettingsPreviewDto>("/admin/platform-settings/preview", {
    method: "POST",
    body: input,
  });
}

/** POST /admin/platform-settings — publishes a version and retires the old. */
export async function publishPlatformSettings(
  input: PlatformSettingInput,
): Promise<PlatformSettingDto> {
  return apiFetch<PlatformSettingDto>("/admin/platform-settings", {
    method: "POST",
    body: input,
  });
}

/**
 * GET /admin/exports — what this admin may export, and whether email works.
 *
 * Fetched per page rather than cached in a context: it is a tiny payload, and
 * the answer depends on the signed-in admin's permissions, which a shared cache
 * would get wrong the moment somebody's role changed.
 */
export async function getExportOptions(): Promise<ExportOptionsDto | null> {
  return apiFetchOptional<ExportOptionsDto>("/admin/exports");
}
