"use client";

import { useState, useTransition } from "react";

import { SelectField, TextAreaField, TextField } from "../../../_components/form-field";
import { useToast } from "../../../_components/toast-provider";
import { updateVendorAction } from "../../_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { VendorDetail } from "@/lib/mappers/vendor.mapper";

/**
 * Correcting a vendor's operational data.
 *
 * `PUT /admin/vendors/{id}` has existed since admin vendor management landed
 * and nothing on the dashboard called it, so a support call about a wrong
 * address, a wrong business type or a delivery radius that was never right had
 * no resolution path short of asking the vendor to fix it themselves — which is
 * exactly what they cannot do for the business type.
 *
 * Deliberately not here: moderation state, payout details, opening hours and
 * images. Each has its own endpoint and its own permission, and folding them
 * into one form would mean one permission gating all five.
 */
export function EditVendorDialog({
  vendor,
  businessTypes,
  onClose,
}: {
  vendor: VendorDetail;
  businessTypes: { id: number; name: string }[];
  onClose: () => void;
}) {
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState("");

  const [draft, setDraft] = useState({
    business_name: vendor.businessName,
    business_type_id: String(vendor.businessTypeId ?? ""),
    contact_person_name: vendor.contactPersonName,
    business_address: vendor.businessAddress,
    city: vendor.city,
    description: vendor.description ?? "",
    latitude: vendor.latitude != null ? String(vendor.latitude) : "",
    longitude: vendor.longitude != null ? String(vendor.longitude) : "",
    delivery_fee: String(vendor.deliveryFee ?? ""),
    min_order: String(vendor.minOrder ?? ""),
    delivery_radius_km: vendor.deliveryRadiusKm != null ? String(vendor.deliveryRadiusKm) : "",
    delivery_time_min: String(vendor.deliveryTimeMin ?? ""),
    delivery_time_max: String(vendor.deliveryTimeMax ?? ""),
    estimated_prep_time_minutes:
      vendor.estimatedPrepTimeMinutes != null ? String(vendor.estimatedPrepTimeMinutes) : "",
    promo_text: vendor.promoText ?? "",
    tax_identification_number: vendor.taxIdentificationNumber ?? "",
  });

  function set(key: keyof typeof draft) {
    return (value: string) => setDraft((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      setErrors({});
      setFailure("");

      const result = await updateVendorAction(vendor.id, {
        business_name: draft.business_name.trim(),
        business_type_id: Number(draft.business_type_id),
        contact_person_name: draft.contact_person_name.trim(),
        business_address: draft.business_address.trim(),
        city: draft.city.trim(),
        description: draft.description.trim() || undefined,
        latitude: numberOrUndefined(draft.latitude),
        longitude: numberOrUndefined(draft.longitude),
        delivery_fee: numberOrUndefined(draft.delivery_fee),
        min_order: numberOrUndefined(draft.min_order),
        delivery_radius_km: numberOrUndefined(draft.delivery_radius_km),
        delivery_time_min: numberOrUndefined(draft.delivery_time_min),
        delivery_time_max: numberOrUndefined(draft.delivery_time_max),
        estimated_prep_time_minutes: numberOrUndefined(draft.estimated_prep_time_minutes),
        promo_text: draft.promo_text.trim() || undefined,
        tax_identification_number: draft.tax_identification_number.trim() || undefined,
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
        aria-label={`Edit ${vendor.businessName}`}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col gap-5 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="break-words text-base font-semibold text-foreground">
            Edit {vendor.businessName}
          </h2>
          <p className="break-words text-sm text-text-secondary">
            Opening hours, images, payout details and moderation each have their own control.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="business_name"
            label="Business name"
            value={draft.business_name}
            onChange={set("business_name")}
            error={fieldError(errors, "business_name")}
            disabled={pending}
          />
          <SelectField
            id="business_type_id"
            label="Business type"
            value={draft.business_type_id}
            onChange={set("business_type_id")}
            options={businessTypes.map((type) => ({ value: String(type.id), label: type.name }))}
            placeholder={businessTypes.length === 0 ? "Needs catalogue access" : undefined}
            // The one field a vendor cannot change themselves, which is why a
            // wrong business type used to have no resolution path at all.
            hint="Vendors cannot change this themselves."
            error={fieldError(errors, "business_type_id")}
            disabled={pending || businessTypes.length === 0}
          />
          <TextField
            id="contact_person_name"
            label="Contact person"
            value={draft.contact_person_name}
            onChange={set("contact_person_name")}
            error={fieldError(errors, "contact_person_name")}
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
        </div>

        <TextField
          id="business_address"
          label="Business address"
          value={draft.business_address}
          onChange={set("business_address")}
          error={fieldError(errors, "business_address")}
          disabled={pending}
        />

        <TextAreaField
          id="description"
          label="Description"
          value={draft.description}
          onChange={set("description")}
          error={fieldError(errors, "description")}
          disabled={pending}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="latitude"
            label="Latitude"
            type="number"
            value={draft.latitude}
            onChange={set("latitude")}
            hint="Without coordinates the delivery fee falls back to the flat rate."
            error={fieldError(errors, "latitude")}
            disabled={pending}
          />
          <TextField
            id="longitude"
            label="Longitude"
            type="number"
            value={draft.longitude}
            onChange={set("longitude")}
            error={fieldError(errors, "longitude")}
            disabled={pending}
          />
          <TextField
            id="delivery_fee"
            label="Flat delivery fee (GHS)"
            type="number"
            value={draft.delivery_fee}
            onChange={set("delivery_fee")}
            hint="Used only when the vendor or the address has no coordinates."
            error={fieldError(errors, "delivery_fee")}
            disabled={pending}
          />
          <TextField
            id="min_order"
            label="Minimum order (GHS)"
            type="number"
            value={draft.min_order}
            onChange={set("min_order")}
            error={fieldError(errors, "min_order")}
            disabled={pending}
          />
          <TextField
            id="delivery_radius_km"
            label="Delivery radius (road km)"
            type="number"
            value={draft.delivery_radius_km}
            onChange={set("delivery_radius_km")}
            hint="The tighter of this and the platform maximum wins."
            error={fieldError(errors, "delivery_radius_km")}
            disabled={pending}
          />
          <TextField
            id="estimated_prep_time_minutes"
            label="Prep time (minutes)"
            type="number"
            value={draft.estimated_prep_time_minutes}
            onChange={set("estimated_prep_time_minutes")}
            error={fieldError(errors, "estimated_prep_time_minutes")}
            disabled={pending}
          />
          <TextField
            id="delivery_time_min"
            label="Quoted delivery time, low (minutes)"
            type="number"
            value={draft.delivery_time_min}
            onChange={set("delivery_time_min")}
            error={fieldError(errors, "delivery_time_min")}
            disabled={pending}
          />
          <TextField
            id="delivery_time_max"
            label="Quoted delivery time, high (minutes)"
            type="number"
            value={draft.delivery_time_max}
            onChange={set("delivery_time_max")}
            error={fieldError(errors, "delivery_time_max")}
            disabled={pending}
          />
          <TextField
            id="promo_text"
            label="Promo text"
            value={draft.promo_text}
            onChange={set("promo_text")}
            error={fieldError(errors, "promo_text")}
            disabled={pending}
          />
          <TextField
            id="tax_identification_number"
            label="TIN"
            value={draft.tax_identification_number}
            onChange={set("tax_identification_number")}
            error={fieldError(errors, "tax_identification_number")}
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

/** Blank means "leave it alone", not zero — the backend rules are `nullable`. */
function numberOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
