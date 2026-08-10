"use client";

import { VENDOR_CATEGORIES } from "../../_lib/vendors";
import type { VendorCategory } from "../../_services/vendors-mock-data";
import type { UseVendorComposer } from "../../_hooks/use-vendor-composer";

function inputClass() {
  return "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";
}

function labelClass() {
  return "text-sm font-medium text-text-secondary";
}

export function VendorBusinessStep({ composer }: { composer: UseVendorComposer }) {
  const { state, update } = composer;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="business-name" className={labelClass()}>
            Business name
          </label>
          <input id="business-name" value={state.businessName} onChange={(e) => update("businessName", e.target.value)} className={inputClass()} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="registration-name" className={labelClass()}>
            Registration name <span className="text-text-muted">(optional)</span>
          </label>
          <input
            id="registration-name"
            value={state.registrationName}
            onChange={(e) => update("registrationName", e.target.value)}
            className={inputClass()}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="business-description" className={labelClass()}>
          Description
        </label>
        <textarea
          id="business-description"
          value={state.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="business-category" className={labelClass()}>
          Category
        </label>
        <select
          id="business-category"
          value={state.category}
          onChange={(e) => update("category", e.target.value as VendorCategory)}
          className={`${inputClass()} max-w-sm`}
        >
          {VENDOR_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="business-phone" className={labelClass()}>
            Business phone
          </label>
          <input id="business-phone" value={state.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234 80..." className={inputClass()} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="business-email" className={labelClass()}>
            Business email
          </label>
          <input id="business-email" type="email" value={state.email} onChange={(e) => update("email", e.target.value)} className={inputClass()} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="business-website" className={labelClass()}>
          Website / social link <span className="text-text-muted">(optional)</span>
        </label>
        <input
          id="business-website"
          value={state.website}
          onChange={(e) => update("website", e.target.value)}
          className={`${inputClass()} max-w-sm`}
        />
      </div>
    </div>
  );
}
