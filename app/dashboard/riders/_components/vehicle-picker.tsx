"use client";

import { SelectField } from "../../_components/form-field";
import { fieldError, type FieldErrors } from "@/lib/api/errors";

/**
 * The type -> make -> model cascade, shared by the rider composer and the edit
 * dialog so both agree on what is selectable.
 *
 * The three lists are fetched once on the server and passed in whole: they are
 * a few hundred rows between them, and filtering in the browser keeps the
 * cascade instant instead of a request per step. The backend still enforces the
 * relationships — a make from another type, or a model from another make, is
 * refused rather than adopted.
 */

export type VehicleTypeOption = {
  id: number;
  name: string;
  isActive: boolean;
  requiresPlate: boolean;
};

export type VehicleMakeOption = {
  id: number;
  vehicleTypeId: number;
  name: string;
  isActive: boolean;
};

export type VehicleModelOption = {
  id: number;
  vehicleMakeId: number;
  name: string;
  isActive: boolean;
};

export type VehicleCatalogue = {
  types: VehicleTypeOption[];
  makes: VehicleMakeOption[];
  models: VehicleModelOption[];
};

export type VehicleSelection = {
  vehicle_type_id: string;
  vehicle_make_id: string;
  vehicle_model_id: string;
};

/**
 * Whether the chosen type demands a number plate.
 *
 * Read off the type rather than hard-coded against "bicycle": the fleet is a
 * table now, and a new type an admin adds carries its own answer.
 */
export function requiresPlate(catalogue: VehicleCatalogue, typeId: string): boolean {
  const type = catalogue.types.find((candidate) => String(candidate.id) === typeId);

  // Nothing picked yet: don't demand a plate for a vehicle nobody has chosen.
  return type?.requiresPlate ?? false;
}

/**
 * A retired type is still shown when a rider is already on it — they have to
 * stay editable — but it is labelled so nobody picks it by accident.
 */
function label(name: string, isActive: boolean): string {
  return isActive ? name : `${name} — retired`;
}

export function VehiclePicker({
  catalogue,
  selection,
  onChange,
  errors,
  disabled,
  required,
}: {
  catalogue: VehicleCatalogue;
  selection: VehicleSelection;
  onChange: (next: VehicleSelection) => void;
  errors: FieldErrors;
  disabled?: boolean;
  required?: boolean;
}) {
  const typeId = selection.vehicle_type_id;
  const makeId = selection.vehicle_make_id;

  const makes = catalogue.makes.filter((make) => String(make.vehicleTypeId) === typeId);
  const models = catalogue.models.filter((model) => String(model.vehicleMakeId) === makeId);

  return (
    <>
      <SelectField
        id="vehicle_type_id"
        label="Vehicle type"
        required={required}
        value={typeId}
        placeholder="Choose a vehicle"
        // Changing the type invalidates both children: a make belongs to one
        // type, so keeping the old one would send a pair the API refuses.
        onChange={(value) =>
          onChange({ vehicle_type_id: value, vehicle_make_id: "", vehicle_model_id: "" })
        }
        options={catalogue.types.map((type) => ({
          value: String(type.id),
          label: label(type.name, type.isActive),
        }))}
        error={fieldError(errors, "vehicle_type_id")}
        disabled={disabled}
      />

      <SelectField
        id="vehicle_make_id"
        label="Make"
        value={makeId}
        placeholder={typeId === "" ? "Pick a vehicle type first" : "Not recorded yet"}
        hint={
          typeId !== "" && makes.length === 0
            ? "No makes are listed under this type yet — add one under Catalogue → Vehicle makes."
            : undefined
        }
        onChange={(value) =>
          onChange({ ...selection, vehicle_make_id: value, vehicle_model_id: "" })
        }
        options={makes.map((make) => ({ value: String(make.id), label: label(make.name, make.isActive) }))}
        error={fieldError(errors, "vehicle_make_id")}
        disabled={disabled || typeId === ""}
      />

      <SelectField
        id="vehicle_model_id"
        label="Model"
        value={selection.vehicle_model_id}
        placeholder={makeId === "" ? "Pick a make first" : "Not recorded yet"}
        hint={
          makeId !== "" && models.length === 0
            ? "No models are listed under this make yet — add one under Catalogue → Vehicle models."
            : undefined
        }
        onChange={(value) => onChange({ ...selection, vehicle_model_id: value })}
        options={models.map((model) => ({
          value: String(model.id),
          label: label(model.name, model.isActive),
        }))}
        error={fieldError(errors, "vehicle_model_id")}
        disabled={disabled || makeId === ""}
      />
    </>
  );
}
