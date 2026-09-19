import { apiFetch, apiFetchAll, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { VehicleMakeDto } from "../types/api";

/** Manufacturers, filed under the vehicle type they make. */

export type VehicleMakeListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  vehicle_type_id?: number;
};

export async function listVehicleMakes(query: VehicleMakeListQuery): Promise<Paginated<VehicleMakeDto>> {
  return apiFetchPage<VehicleMakeDto>("/admin/vehicle-makes", { query });
}

export async function getVehicleMake(id: number): Promise<VehicleMakeDto> {
  return apiFetch<VehicleMakeDto>(`/admin/vehicle-makes/${id}`);
}

export type CreateVehicleMakeInput = {
  vehicle_type_id: number;
  name: string;
  is_active?: boolean;
  display_order?: number;
};

/** Re-parenting is not offered, so an edit carries no vehicle_type_id. */
export type UpdateVehicleMakeInput = {
  name: string;
  is_active?: boolean;
  display_order?: number;
};

export async function createVehicleMake(input: CreateVehicleMakeInput): Promise<VehicleMakeDto> {
  return apiFetch<VehicleMakeDto>("/admin/vehicle-makes", { method: "POST", body: input });
}

export async function updateVehicleMake(id: number, input: UpdateVehicleMakeInput): Promise<VehicleMakeDto> {
  return apiFetch<VehicleMakeDto>(`/admin/vehicle-makes/${id}`, { method: "PUT", body: input });
}

export async function deleteVehicleMake(id: number): Promise<null> {
  return apiFetch<null>(`/admin/vehicle-makes/${id}`, { method: "DELETE" });
}

export async function toggleVehicleMakeStatus(id: number): Promise<VehicleMakeDto> {
  return apiFetch<VehicleMakeDto>(`/admin/vehicle-makes/${id}/toggle-status`, { method: "PATCH" });
}

export async function listAllVehicleMakes(vehicleTypeId?: number): Promise<VehicleMakeDto[]> {
  return apiFetchAll<VehicleMakeDto>("/admin/vehicle-makes", {
    query: vehicleTypeId ? { vehicle_type_id: vehicleTypeId } : {},
  });
}
