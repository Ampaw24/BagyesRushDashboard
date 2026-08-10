"use client";

import { useState, type FormEvent } from "react";
import { VENDOR_CATEGORIES } from "../../../_lib/vendors";
import type { Vendor, VendorCategory } from "../../../_services/vendors-mock-data";

type SaveStatus = "idle" | "saving" | "saved";

function inputClass() {
  return "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";
}

function labelClass() {
  return "text-sm font-medium text-text-secondary";
}

export function VendorSettingsForm({ vendor, onUpdate }: { vendor: Vendor; onUpdate: (updates: Partial<Vendor>) => void }) {
  const [businessName, setBusinessName] = useState(vendor.businessName);
  const [description, setDescription] = useState(vendor.description);
  const [category, setCategory] = useState<VendorCategory>(vendor.category);
  const [phone, setPhone] = useState(vendor.phone);
  const [email, setEmail] = useState(vendor.email);
  const [address, setAddress] = useState(vendor.address);
  const [city, setCity] = useState(vendor.city);
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(vendor.minimumOrderAmount);
  const [status, setStatus] = useState<SaveStatus>("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    await new Promise((resolve) => setTimeout(resolve, 700));
    onUpdate({ businessName, description, category, phone, email, address, city, minimumOrderAmount, updatedAt: new Date() });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-name" className={labelClass()}>
            Business name
          </label>
          <input id="settings-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass()} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-category" className={labelClass()}>
            Category
          </label>
          <select id="settings-category" value={category} onChange={(e) => setCategory(e.target.value as VendorCategory)} className={inputClass()}>
            {VENDOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-description" className={labelClass()}>
          Description
        </label>
        <textarea
          id="settings-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-phone" className={labelClass()}>
            Phone
          </label>
          <input id="settings-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass()} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-email" className={labelClass()}>
            Email
          </label>
          <input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass()} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-address" className={labelClass()}>
            Address
          </label>
          <input id="settings-address" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass()} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-city" className={labelClass()}>
            City
          </label>
          <input id="settings-city" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass()} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-min-order" className={labelClass()}>
          Minimum order amount (₦)
        </label>
        <input
          id="settings-min-order"
          type="number"
          min={0}
          value={minimumOrderAmount}
          onChange={(e) => setMinimumOrderAmount(Number(e.target.value))}
          className={`${inputClass()} max-w-[12rem]`}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        {status === "saved" && <span className="text-sm font-medium text-delta-good">Saved</span>}
      </div>
    </form>
  );
}
