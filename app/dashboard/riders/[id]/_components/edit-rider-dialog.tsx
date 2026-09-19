"use client";

import { useState, useTransition } from "react";

import { SelectField, TextField } from "../../../_components/form-field";
import { useToast } from "../../../_components/toast-provider";
import { updateRiderAction } from "../../_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { RiderDetail } from "@/lib/mappers/rider.mapper";
import { IDENTITY_DOCUMENT_TYPES, identityDocumentLabels } from "@/lib/types/enums";
import {
  VehiclePicker,
  requiresPlate,
  type VehicleCatalogue,
} from "../../_components/vehicle-picker";

/**
 * Correcting a rider's details.
 *
 * `PUT /admin/riders/{id}` shipped with rider management and nothing on the
 * dashboard called it, so a mistyped plate, a wrong city or a licence expiry
 * that needed updating after a renewal could only be fixed by the rider, in the
 * app, on a motorbike.
 *
 * Status, availability, documents and payout are all deliberately elsewhere:
 * `Rider::$fillable` excludes them, `UpdateRiderProfileRequest` does not accept
 * them, and each has its own permission.
 */
export function EditRiderDialog({
  rider,
  catalogue,
  onClose,
}: {
  rider: RiderDetail;
  catalogue: VehicleCatalogue;
  onClose: () => void;
}) {
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState("");

  const [draft, setDraft] = useState({
    first_name: rider.firstName,
    last_name: rider.lastName,
    city: rider.city ?? "",
    residential_address: rider.residentialAddress ?? "",
    date_of_birth: toDateInput(rider.dateOfBirth),
    id_type: rider.identity.type ?? "",
    id_number: rider.identity.number ?? "",
    vehicle_type_id: rider.vehicleTypeId != null ? String(rider.vehicleTypeId) : "",
    vehicle_make_id: rider.vehicle.makeId != null ? String(rider.vehicle.makeId) : "",
    vehicle_model_id: rider.vehicle.modelId != null ? String(rider.vehicle.modelId) : "",
    plate_number: rider.plateNumber ?? "",
    vehicle_colour: rider.vehicle.colour ?? "",
    vehicle_year: rider.vehicle.year != null ? String(rider.vehicle.year) : "",
    emergency_contact_name: rider.emergencyContact.name ?? "",
    emergency_contact_phone: rider.emergencyContact.phone ?? "",
  });

  function set(key: keyof typeof draft) {
    return (value: string) => setDraft((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      setErrors({});
      setFailure("");

      const result = await updateRiderAction(rider.id, {
        first_name: draft.first_name.trim(),
        last_name: draft.last_name.trim(),
        city: draft.city.trim(),
        residential_address: draft.residential_address.trim() || null,
        date_of_birth: draft.date_of_birth || null,
        id_type: draft.id_type || null,
        id_number: draft.id_number.trim() || null,
        // Omitted rather than sent as 0 when there is nothing selected: the
        // rule is `sometimes`, so leaving it out keeps the rider's current
        // vehicle, while Number("") would be 0 and fail as "does not exist".
        ...(draft.vehicle_type_id ? { vehicle_type_id: Number(draft.vehicle_type_id) } : {}),
        vehicle_make_id: draft.vehicle_make_id ? Number(draft.vehicle_make_id) : null,
        vehicle_model_id: draft.vehicle_model_id ? Number(draft.vehicle_model_id) : null,
        plate_number: draft.plate_number.trim() || null,
        vehicle_colour: draft.vehicle_colour.trim() || null,
        vehicle_year: draft.vehicle_year ? Number(draft.vehicle_year) : null,
        emergency_contact_name: draft.emergency_contact_name.trim() || null,
        emergency_contact_phone: draft.emergency_contact_phone.trim() || null,
      });

      notify(result);

      if (result.ok) {
        onClose();
        return;
      }

      setErrors(result.errors);
      setFailure(result.message);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={pending ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${rider.name}`}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col gap-5 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="break-words text-base font-semibold text-foreground">Edit {rider.name}</h2>
          <p className="break-words text-sm text-text-secondary">
            Documents, payout details, availability and approval each have their own control.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="first_name"
            label="First name"
            value={draft.first_name}
            onChange={set("first_name")}
            error={fieldError(errors, "first_name")}
            disabled={pending}
          />
          <TextField
            id="last_name"
            label="Last name"
            value={draft.last_name}
            onChange={set("last_name")}
            error={fieldError(errors, "last_name")}
            disabled={pending}
          />
          <TextField
            id="city"
            label="City"
            value={draft.city}
            onChange={set("city")}
            error={fieldError(errors, "city")}
            disabled={pending}
          />
          <TextField
            id="date_of_birth"
            label="Date of birth"
            type="date"
            value={draft.date_of_birth}
            onChange={set("date_of_birth")}
            hint="Must be 18 or over."
            error={fieldError(errors, "date_of_birth")}
            disabled={pending}
          />
          <SelectField
            id="id_type"
            label="Identity document"
            value={draft.id_type}
            onChange={set("id_type")}
            placeholder="Not recorded"
            options={IDENTITY_DOCUMENT_TYPES.map((type) => ({
              value: type,
              label: identityDocumentLabels[type],
            }))}
            error={fieldError(errors, "id_type")}
            disabled={pending}
          />
          <TextField
            id="id_number"
            label="Document number"
            value={draft.id_number}
            onChange={set("id_number")}
            error={fieldError(errors, "id_number")}
            disabled={pending}
          />
        </div>

        <TextField
          id="residential_address"
          label="Residential address"
          value={draft.residential_address}
          onChange={set("residential_address")}
          error={fieldError(errors, "residential_address")}
          disabled={pending}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <VehiclePicker
            catalogue={catalogue}
            selection={{
              vehicle_type_id: draft.vehicle_type_id,
              vehicle_make_id: draft.vehicle_make_id,
              vehicle_model_id: draft.vehicle_model_id,
            }}
            onChange={(next) => setDraft((current) => ({ ...current, ...next }))}
            errors={errors}
            disabled={pending}
          />
          <TextField
            id="plate_number"
            label="Number plate"
            required={requiresPlate(catalogue, draft.vehicle_type_id)}
            value={draft.plate_number}
            onChange={set("plate_number")}
            error={fieldError(errors, "plate_number")}
            disabled={pending}
          />
          <TextField
            id="vehicle_colour"
            label="Colour"
            value={draft.vehicle_colour}
            onChange={set("vehicle_colour")}
            error={fieldError(errors, "vehicle_colour")}
            disabled={pending}
          />
          <TextField
            id="vehicle_year"
            label="Year"
            type="number"
            value={draft.vehicle_year}
            onChange={set("vehicle_year")}
            error={fieldError(errors, "vehicle_year")}
            disabled={pending}
          />
          <TextField
            id="emergency_contact_name"
            label="Emergency contact"
            value={draft.emergency_contact_name}
            onChange={set("emergency_contact_name")}
            error={fieldError(errors, "emergency_contact_name")}
            disabled={pending}
          />
          <TextField
            id="emergency_contact_phone"
            label="Emergency contact phone"
            type="tel"
            value={draft.emergency_contact_phone}
            onChange={set("emergency_contact_phone")}
            error={fieldError(errors, "emergency_contact_phone")}
            disabled={pending}
          />
        </div>

        {failure && (
          <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
            {failure}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** `<input type="date">` wants `YYYY-MM-DD`, not an ISO instant. */
function toDateInput(date: Date | null): string {
  if (!date) return "";
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
