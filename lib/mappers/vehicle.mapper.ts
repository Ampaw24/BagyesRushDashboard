import type { VehicleMakeDto, VehicleModelDto, VehicleTypeDto } from "../types/api";
import type { ParcelSize } from "../types/enums";
import { toDateOrEpoch } from "./dates";

export type VehicleTypeRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  requiresPlate: boolean;
  maxParcelSize: ParcelSize | null;
  maxParcelSizeLabel: string | null;
  isActive: boolean;
  displayOrder: number;
  makesCount: number | null;
  ridersCount: number | null;
  createdAt: Date;
};

export function toVehicleTypeRow(dto: VehicleTypeDto): VehicleTypeRow {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    description: dto.description,
    requiresPlate: dto.requires_plate,
    maxParcelSize: dto.max_parcel_size,
    maxParcelSizeLabel: dto.max_parcel_size_label,
    isActive: dto.is_active,
    displayOrder: dto.display_order,
    makesCount: dto.makes_count ?? null,
    ridersCount: dto.riders_count ?? null,
    createdAt: toDateOrEpoch(dto.created_at),
  };
}

export type VehicleMakeRow = {
  id: number;
  vehicleTypeId: number;
  vehicleTypeName: string | null;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
  modelsCount: number | null;
  ridersCount: number | null;
  createdAt: Date;
};

export function toVehicleMakeRow(dto: VehicleMakeDto): VehicleMakeRow {
  return {
    id: dto.id,
    vehicleTypeId: dto.vehicle_type_id,
    vehicleTypeName: dto.vehicle_type?.name ?? null,
    name: dto.name,
    slug: dto.slug,
    isActive: dto.is_active,
    displayOrder: dto.display_order,
    modelsCount: dto.models_count ?? null,
    ridersCount: dto.riders_count ?? null,
    createdAt: toDateOrEpoch(dto.created_at),
  };
}

export type VehicleModelRow = {
  id: number;
  vehicleMakeId: number;
  vehicleMakeName: string | null;
  vehicleTypeName: string | null;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
  ridersCount: number | null;
  createdAt: Date;
};

export function toVehicleModelRow(dto: VehicleModelDto): VehicleModelRow {
  return {
    id: dto.id,
    vehicleMakeId: dto.vehicle_make_id,
    vehicleMakeName: dto.vehicle_make?.name ?? null,
    vehicleTypeName: dto.vehicle_make?.vehicle_type?.name ?? null,
    name: dto.name,
    slug: dto.slug,
    isActive: dto.is_active,
    displayOrder: dto.display_order,
    ridersCount: dto.riders_count ?? null,
    createdAt: toDateOrEpoch(dto.created_at),
  };
}
