import { useMemo, useState } from "react";
import type { VendorCategory } from "../_services/vendors-mock-data";

export const VENDOR_COMPOSER_STEPS = ["Business Info", "Owner Info", "Location", "Operating Info", "Review"] as const;

export type VendorComposerState = {
  step: number;
  businessName: string;
  registrationName: string;
  description: string;
  category: VendorCategory;
  phone: string;
  email: string;
  website: string;
  ownerUserId: string;
  address: string;
  city: string;
  region: string;
  deliveryAreaKm: number;
  openingTime: string;
  closingTime: string;
  operatingDays: string[];
  minimumOrderAmount: number;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  estimatedPrepMinutes: number;
};

export type VendorSubmitStatus = { phase: "idle" | "submitting" | "done" };

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function initialState(): VendorComposerState {
  return {
    step: 0,
    businessName: "",
    registrationName: "",
    description: "",
    category: "Restaurant",
    phone: "",
    email: "",
    website: "",
    ownerUserId: "",
    address: "",
    city: "",
    region: "",
    deliveryAreaKm: 5,
    openingTime: "09:00",
    closingTime: "22:00",
    operatingDays: [...ALL_DAYS],
    minimumOrderAmount: 1500,
    deliveryAvailable: true,
    pickupAvailable: false,
    estimatedPrepMinutes: 25,
  };
}

export function useVendorComposer() {
  const [state, setState] = useState<VendorComposerState>(initialState);
  const [submitStatus, setSubmitStatus] = useState<VendorSubmitStatus>({ phase: "idle" });

  function update<K extends keyof VendorComposerState>(key: K, value: VendorComposerState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDay(day: string) {
    setState((prev) => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day) ? prev.operatingDays.filter((d) => d !== day) : [...prev.operatingDays, day],
    }));
  }

  const stepErrors = useMemo(() => getStepErrors(state), [state]);

  function next() {
    if (stepErrors.length > 0) return;
    setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, VENDOR_COMPOSER_STEPS.length - 1) }));
  }

  function back() {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 0) }));
  }

  function goToStep(step: number) {
    setState((prev) => ({ ...prev, step }));
  }

  async function submit() {
    setSubmitStatus({ phase: "submitting" });
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSubmitStatus({ phase: "done" });
  }

  return { state, update, toggleDay, stepErrors, next, back, goToStep, submit, submitStatus };
}

export type UseVendorComposer = ReturnType<typeof useVendorComposer>;

function getStepErrors(state: VendorComposerState): string[] {
  const errors: string[] = [];

  if (state.step === 0) {
    if (state.businessName.trim() === "") errors.push("Business name is required.");
    if (state.phone.trim() === "") errors.push("Business phone is required.");
    if (state.email.trim() === "") errors.push("Business email is required.");
  }

  if (state.step === 1) {
    if (state.ownerUserId === "") errors.push("Select an owner account.");
  }

  if (state.step === 2) {
    if (state.address.trim() === "") errors.push("Address is required.");
    if (state.city.trim() === "") errors.push("City is required.");
  }

  if (state.step === 3) {
    if (!state.openingTime || !state.closingTime) errors.push("Opening and closing time are required.");
    if (state.operatingDays.length === 0) errors.push("Select at least one operating day.");
    if (!state.deliveryAvailable && !state.pickupAvailable) errors.push("Enable delivery, pickup, or both.");
  }

  return errors;
}
