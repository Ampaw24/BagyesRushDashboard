import { apiFetch, apiFetchAll, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { VehicleTypeDto } from "../types/api";
import type { ParcelSize } from "../types/enums";

/**
 * The fleet: what a rider is allowed to ride.
 *
 * Reference data in the same shape as business types — no image, so update is
 * a PUT. What makes this one load-bearing is that `is_active` is the fleet
 * gate: deactivating a type stops riders registering on it, takes its makes and
 * models off the public API, and narrows the parcel sizes customers are
 * offered.
 */

export type VehicleTypeListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
};

export async function listVehicleTypes(query: VehicleTypeListQuery): Promise<Paginated<VehicleTypeDto>> {
  return apiFetchPage<VehicleTypeDto>("/admin/vehicle-types", { query });
}

export async function getVehicleType(id: number): Promise<VehicleTypeDto> {
  return apiFetch<VehicleTypeDto>(`/admin/vehicle-types/${id}`);
}

export type SaveVehicleTypeInput = {
  name: string;
  description?: string | null;
  requires_plate?: boolean;
  max_parcel_size?: ParcelSize;
  is_active?: boolean;
  display_order?: number;
};

export async function createVehicleType(input: SaveVehicleTypeInput): Promise<VehicleTypeDto> {
  return apiFetch<VehicleTypeDto>("/admin/vehicle-types", { method: "POST", body: input });
}

export async function updateVehicleType(id: number, input: SaveVehicleTypeInput): Promise<VehicleTypeDto> {
  return apiFetch<VehicleTypeDto>(`/admin/vehicle-types/${id}`, { method: "PUT", body: input });
}

export async function deleteVehicleType(id: number): Promise<null> {
  return apiFetch<null>(`/admin/vehicle-types/${id}`, { method: "DELETE" });
}

export async function toggleVehicleTypeStatus(id: number): Promise<VehicleTypeDto> {
  return apiFetch<VehicleTypeDto>(`/admin/vehicle-types/${id}/toggle-status`, { method: "PATCH" });
}

/**
 * Every type, for a picker.
 *
 * Deliberately not filtered to active: a rider registered before a type was
 * retired still has to be editable, and the rider forms mark the retired
 * options rather than dropping them.
 */
export async function listAllVehicleTypes(): Promise<VehicleTypeDto[]> {
  return apiFetchAll<VehicleTypeDto>("/admin/vehicle-types");
}

export async function listActiveVehicleTypes(): Promise<VehicleTypeDto[]> {
  return apiFetchAll<VehicleTypeDto>("/admin/vehicle-types", { query: { is_active: true } });
}
