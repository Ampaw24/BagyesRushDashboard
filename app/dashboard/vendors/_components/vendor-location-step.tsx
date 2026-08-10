"use client";

import type { UseVendorComposer } from "../../_hooks/use-vendor-composer";

function inputClass() {
  return "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";
}

function labelClass() {
  return "text-sm font-medium text-text-secondary";
}

export function VendorLocationStep({ composer }: { composer: UseVendorComposer }) {
  const { state, update } = composer;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="vendor-address" className={labelClass()}>
          Address
        </label>
        <input id="vendor-address" value={state.address} onChange={(e) => update("address", e.target.value)} className={inputClass()} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="vendor-city" className={labelClass()}>
            City
          </label>
          <input id="vendor-city" value={state.city} onChange={(e) => update("city", e.target.value)} className={inputClass()} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="vendor-region" className={labelClass()}>
            Region / area
          </label>
          <input id="vendor-region" value={state.region} onChange={(e) => update("region", e.target.value)} className={inputClass()} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="vendor-delivery-area" className={labelClass()}>
          Delivery area radius (km)
        </label>
        <input
          id="vendor-delivery-area"
          type="number"
          min={1}
          max={50}
          value={state.deliveryAreaKm}
          onChange={(e) => update("deliveryAreaKm", Number(e.target.value))}
          className={`${inputClass()} max-w-[10rem]`}
        />
      </div>
    </div>
  );
}
