"use client";

import type { UseVendorComposer } from "../../_hooks/use-vendor-composer";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function inputClass() {
  return "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";
}

function labelClass() {
  return "text-sm font-medium text-text-secondary";
}

export function VendorOperatingStep({ composer }: { composer: UseVendorComposer }) {
  const { state, update, toggleDay } = composer;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="opening-time" className={labelClass()}>
            Opening time
          </label>
          <input id="opening-time" type="time" value={state.openingTime} onChange={(e) => update("openingTime", e.target.value)} className={inputClass()} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="closing-time" className={labelClass()}>
            Closing time
          </label>
          <input id="closing-time" type="time" value={state.closingTime} onChange={(e) => update("closingTime", e.target.value)} className={inputClass()} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className={labelClass()}>Operating days</p>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              aria-pressed={state.operatingDays.includes(day)}
              className={`flex h-9 items-center rounded-full px-3.5 text-xs font-medium transition duration-150 ${
                state.operatingDays.includes(day) ? "bg-brand text-brand-foreground" : "bg-surface-muted text-text-secondary hover:bg-border-subtle"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="minimum-order" className={labelClass()}>
            Minimum order amount (₦)
          </label>
          <input
            id="minimum-order"
            type="number"
            min={0}
            value={state.minimumOrderAmount}
            onChange={(e) => update("minimumOrderAmount", Number(e.target.value))}
            className={inputClass()}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="prep-time" className={labelClass()}>
            Estimated prep time (minutes)
          </label>
          <input
            id="prep-time"
            type="number"
            min={5}
            value={state.estimatedPrepMinutes}
            onChange={(e) => update("estimatedPrepMinutes", Number(e.target.value))}
            className={inputClass()}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={state.deliveryAvailable} onChange={(e) => update("deliveryAvailable", e.target.checked)} className="h-4 w-4 accent-brand" />
          <span className="text-sm text-foreground">Delivery available</span>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={state.pickupAvailable} onChange={(e) => update("pickupAvailable", e.target.checked)} className="h-4 w-4 accent-brand" />
          <span className="text-sm text-foreground">Pickup available</span>
        </label>
      </div>
    </div>
  );
}
