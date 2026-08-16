"use client";

import { useMemo, useState } from "react";

import { createVendorAction } from "../vendors/_actions";
import type { FieldErrors } from "@/lib/api/errors";

/**
 * Wizard state for `POST /admin/vendors`.
 *
 * The steps now follow CreateVendorRequest rather than the invented shape the
 * mock used. Notably there is no owner picker: the endpoint creates the login
 * from the email and phone given here and returns a generated password once.
 * Fields with no backend equivalent (registration name, website, region,
 * pickup availability) are gone.
 */
export const VENDOR_COMPOSER_STEPS = [
  "Account",
  "Business",
  "Location",
  "Delivery",
  "Review",
] as const;

export type VendorComposerState = {
  step: number;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  businessTypeId: number | null;
  contactPersonName: string;
  description: string;
  categories: string[];
  cuisineTypes: string;
  businessAddress: string;
  city: string;
  latitude: string;
  longitude: string;
  deliveryRadiusKm: string;
  deliveryFee: string;
  minOrder: string;
  deliveryTimeMin: string;
  deliveryTimeMax: string;
  estimatedPrepTimeMinutes: string;
  promoText: string;
};

export type VendorSubmitStatus =
  | { phase: "idle" }
  | { phase: "submitting" }
  /** The one-time password is surfaced here because it can never be read again. */
  | { phase: "done"; vendorId: number; password: string }
  | { phase: "error"; message: string };

function initialState(): VendorComposerState {
  return {
    step: 0,
    email: "",
    phone: "",
    password: "",
    businessName: "",
    businessTypeId: null,
    contactPersonName: "",
    description: "",
    categories: [],
    cuisineTypes: "",
    businessAddress: "",
    city: "",
    latitude: "",
    longitude: "",
    deliveryRadiusKm: "",
    deliveryFee: "",
    minOrder: "",
    deliveryTimeMin: "",
    deliveryTimeMax: "",
    estimatedPrepTimeMinutes: "",
    promoText: "",
  };
}

export function useVendorComposer() {
  const [state, setState] = useState<VendorComposerState>(initialState);
  const [submitStatus, setSubmitStatus] = useState<VendorSubmitStatus>({ phase: "idle" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function update<K extends keyof VendorComposerState>(key: K, value: VendorComposerState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(name: string) {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.includes(name)
        ? prev.categories.filter((c) => c !== name)
        : [...prev.categories, name],
    }));
  }

  const stepErrors = useMemo(() => getStepErrors(state), [state]);

  function next() {
    if (stepErrors.length > 0) return;
    setState((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, VENDOR_COMPOSER_STEPS.length - 1),
    }));
  }

  function back() {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 0) }));
  }

  function goToStep(step: number) {
    setState((prev) => ({ ...prev, step }));
  }

  async function submit() {
    if (state.businessTypeId === null) return;

    setSubmitStatus({ phase: "submitting" });
    setFieldErrors({});

    const result = await createVendorAction({
      email: state.email.trim(),
      phone: state.phone.trim(),
      // Omitted entirely when blank, so the backend generates one.
      ...(state.password ? { password: state.password } : {}),
      business_name: state.businessName.trim(),
      business_type_id: state.businessTypeId,
      contact_person_name: state.contactPersonName.trim(),
      business_address: state.businessAddress.trim(),
      city: state.city.trim(),
      ...optionalText("description", state.description),
      ...(state.categories.length > 0 ? { categories: state.categories } : {}),
      ...(splitList(state.cuisineTypes).length > 0
        ? { cuisine_types: splitList(state.cuisineTypes) }
        : {}),
      ...optionalNumber("latitude", state.latitude),
      ...optionalNumber("longitude", state.longitude),
      ...optionalNumber("delivery_fee", state.deliveryFee),
      ...optionalNumber("min_order", state.minOrder),
      ...optionalNumber("delivery_radius_km", state.deliveryRadiusKm),
      ...optionalNumber("delivery_time_min", state.deliveryTimeMin),
      ...optionalNumber("delivery_time_max", state.deliveryTimeMax),
      ...optionalNumber("estimated_prep_time_minutes", state.estimatedPrepTimeMinutes),
      ...optionalText("promo_text", state.promoText),
    });

    if (result.ok) {
      setSubmitStatus({ phase: "done", vendorId: result.data.id, password: result.data.password });
      return;
    }

    setFieldErrors(result.errors);
    setSubmitStatus({ phase: "error", message: result.message });
  }

  return {
    state,
    update,
    toggleCategory,
    stepErrors,
    fieldErrors,
    next,
    back,
    goToStep,
    submit,
    submitStatus,
  };
}

export type UseVendorComposer = ReturnType<typeof useVendorComposer>;

function optionalText(key: string, value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? {} : { [key]: trimmed };
}

function optionalNumber(key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return {};
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? { [key]: parsed } : {};
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
}

/**
 * Client-side checks mirroring the required fields on CreateVendorRequest.
 * The backend re-validates everything and its 422 is what actually decides.
 */
function getStepErrors(state: VendorComposerState): string[] {
  const errors: string[] = [];

  if (state.step === 0) {
    if (state.email.trim() === "") errors.push("Email is required.");
    if (state.phone.trim() === "") errors.push("Phone is required.");
    if (state.password !== "" && state.password.length < 8) {
      errors.push("A password must be at least 8 characters, or leave it blank to generate one.");
    }
  }

  if (state.step === 1) {
    if (state.businessName.trim() === "") errors.push("Business name is required.");
    if (state.businessTypeId === null) errors.push("Select a business type.");
    if (state.contactPersonName.trim() === "") errors.push("Contact person is required.");
  }

  if (state.step === 2) {
    if (state.businessAddress.trim() === "") errors.push("Business address is required.");
    if (state.city.trim() === "") errors.push("City is required.");
  }

  if (state.step === 3) {
    const min = Number(state.deliveryTimeMin);
    const max = Number(state.deliveryTimeMax);
    if (state.deliveryTimeMin && state.deliveryTimeMax && min > max) {
      errors.push("Minimum delivery time cannot be greater than the maximum.");
    }
  }

  return errors;
}
