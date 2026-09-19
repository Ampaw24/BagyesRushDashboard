import { cache } from "react";

import { listAllVehicleMakes } from "./vehicle-makes.service";
import { listAllVehicleModels } from "./vehicle-models.service";
import { listAllVehicleTypes } from "./vehicle-types.service";
import type { VehicleCatalogue } from "@/app/dashboard/riders/_components/vehicle-picker";

/** Nothing to pick from — see the catch below. */
export const EMPTY_VEHICLE_CATALOGUE: VehicleCatalogue = { types: [], makes: [], models: [] };

/**
 * The whole type -> make -> model tree, for the rider forms.
 *
 * One call rather than a request per cascade step: the three tables are a few
 * hundred rows between them, and a picker that waits on the network after every
 * selection is a picker staff will fight.
 *
 * Inactive rows are included deliberately. A rider already registered on a
 * retired vehicle has to stay editable — the picker labels those rather than
 * dropping them, which is also why this reads the admin endpoints rather than
 * the public ones.
 *
 * **A failure here degrades, it does not throw.** This feeds one dialog on the
 * rider detail screen, which also carries the wallet, the documents and the
 * compliance dates; losing all of that because a lookup table could not be read
 * is out of all proportion. The picker renders empty and says so. The rider
 * *composer* checks for an empty catalogue up front and refuses to pretend it
 * can create a rider without one.
 */
export const getVehicleCatalogue = cache(async (): Promise<VehicleCatalogue> => {
  try {
    const [types, makes, models] = await Promise.all([
      listAllVehicleTypes(),
      listAllVehicleMakes(),
      listAllVehicleModels(),
    ]);

    return {
      types: types.map((type) => ({
        id: type.id,
        name: type.name,
        isActive: type.is_active,
        requiresPlate: type.requires_plate,
      })),
      makes: makes.map((make) => ({
        id: make.id,
        vehicleTypeId: make.vehicle_type_id,
        name: make.name,
        isActive: make.is_active,
      })),
      models: models.map((model) => ({
        id: model.id,
        vehicleMakeId: model.vehicle_make_id,
        name: model.name,
        isActive: model.is_active,
      })),
    };
  } catch (error) {
    // Server-side only, so this lands in the deploy's logs rather than in front
    // of an admin who cannot act on it.
    console.error("[vehicle-catalogue] could not load the fleet tree", error);

    return EMPTY_VEHICLE_CATALOGUE;
  }
});
