import { apiFetch, apiFetchAll, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { VehicleModelDto } from "../types/api";

/** Specific models, filed under their manufacturer. */

export type VehicleModelListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  vehicle_make_id?: number;
};

export async function listVehicleModels(query: VehicleModelListQuery): Promise<Paginated<VehicleModelDto>> {
  return apiFetchPage<VehicleModelDto>("/admin/vehicle-models", { query });
}

export async function getVehicleModel(id: number): Promise<VehicleModelDto> {
  return apiFetch<VehicleModelDto>(`/admin/vehicle-models/${id}`);
}

export type CreateVehicleModelInput = {
  vehicle_make_id: number;
  name: string;
  is_active?: boolean;
  display_order?: number;
};

export type UpdateVehicleModelInput = {
  name: string;
  is_active?: boolean;
  display_order?: number;
};

export async function createVehicleModel(input: CreateVehicleModelInput): Promise<VehicleModelDto> {
  return apiFetch<VehicleModelDto>("/admin/vehicle-models", { method: "POST", body: input });
}

export async function updateVehicleModel(id: number, input: UpdateVehicleModelInput): Promise<VehicleModelDto> {
  return apiFetch<VehicleModelDto>(`/admin/vehicle-models/${id}`, { method: "PUT", body: input });
}

export async function deleteVehicleModel(id: number): Promise<null> {
  return apiFetch<null>(`/admin/vehicle-models/${id}`, { method: "DELETE" });
}

export async function toggleVehicleModelStatus(id: number): Promise<VehicleModelDto> {
  return apiFetch<VehicleModelDto>(`/admin/vehicle-models/${id}/toggle-status`, { method: "PATCH" });
}

/**
 * Every model, paged. There are more than 100 once the fleet is seeded, and the
 * API caps per_page at 100 — asking for 200 answered 422 and took the rider
 * screens down with it.
 */
export async function listAllVehicleModels(vehicleMakeId?: number): Promise<VehicleModelDto[]> {
  return apiFetchAll<VehicleModelDto>("/admin/vehicle-models", {
    query: vehicleMakeId ? { vehicle_make_id: vehicleMakeId } : {},
  });
}
