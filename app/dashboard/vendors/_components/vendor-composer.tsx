"use client";

import Link from "next/link";

import { VENDOR_COMPOSER_STEPS, useVendorComposer, type UseVendorComposer } from "../../_hooks/use-vendor-composer";
import { ProgressSteps } from "../../_components/progress-steps";
import { fieldError } from "@/lib/api/errors";

export type VendorComposerOptions = {
  businessTypes: { id: number; name: string }[];
  /** Category NAMES — the backend validates `categories.*` against the name. */
  categories: string[];
};

export function VendorComposer({ businessTypes, categories }: VendorComposerOptions) {
  const composer = useVendorComposer();
  const { state, stepErrors, next, back, goToStep, submitStatus } = composer;
  const isReviewStep = state.step === VENDOR_COMPOSER_STEPS.length - 1;

  // Once the vendor exists there is nothing left to edit here, and the password
  // must be copied before leaving.
  if (submitStatus.phase === "done") {
    return <CreatedPanel vendorId={submitStatus.vendorId} password={submitStatus.password} />;
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm sm:p-6">
      <ProgressSteps steps={VENDOR_COMPOSER_STEPS} currentStep={state.step} onStepClick={goToStep} />

      {state.step === 0 && <AccountStep composer={composer} />}
      {state.step === 1 && (
        <BusinessStep composer={composer} businessTypes={businessTypes} categories={categories} />
      )}
      {state.step === 2 && <LocationStep composer={composer} />}
      {state.step === 3 && <DeliveryStep composer={composer} />}
      {state.step === 4 && <ReviewStep composer={composer} businessTypes={businessTypes} />}

      <div className="flex items-center justify-between border-t border-border-subtle pt-5">
        <button
          type="button"
          onClick={back}
          disabled={state.step === 0 || submitStatus.phase === "submitting"}
          className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>

        <div className="flex flex-col items-end gap-1">
          {stepErrors.length > 0 && <p className="text-xs text-status-critical">{stepErrors[0]}</p>}
          {submitStatus.phase === "error" && (
            <p className="max-w-xs break-words text-right text-xs text-status-critical">
              {submitStatus.message}
            </p>
          )}
          <button
            type="button"
            onClick={isReviewStep ? composer.submit : next}
            disabled={stepErrors.length > 0 || submitStatus.phase === "submitting"}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitStatus.phase === "submitting" ? "Creating…" : isReviewStep ? "Create vendor" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountStep({ composer }: { composer: UseVendorComposer }) {
  const { state, update, fieldErrors } = composer;

  return (
    <StepBody
      title="Vendor login"
      hint="Creating a vendor also creates the account they sign in with. Leave the password blank to have one generated."
    >
      <Field label="Email" error={fieldError(fieldErrors, "email")}>
        <input
          type="email"
          value={state.email}
          onChange={(event) => update("email", event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Phone" error={fieldError(fieldErrors, "phone")}>
        <input
          type="tel"
          value={state.phone}
          onChange={(event) => update("phone", event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Password (optional)" error={fieldError(fieldErrors, "password")}>
        <input
          type="text"
          value={state.password}
          onChange={(event) => update("password", event.target.value)}
          minLength={8}
          placeholder="Generated if left blank"
          className={inputClass}
        />
      </Field>
    </StepBody>
  );
}

function BusinessStep({
  composer,
  businessTypes,
  categories,
}: {
  composer: UseVendorComposer;
  businessTypes: { id: number; name: string }[];
  categories: string[];
}) {
  const { state, update, toggleCategory, fieldErrors } = composer;

  return (
    <StepBody title="Business details" hint="How the business appears to customers.">
      <Field label="Business name" error={fieldError(fieldErrors, "business_name")}>
        <input
          value={state.businessName}
          onChange={(event) => update("businessName", event.target.value)}
          maxLength={255}
          className={inputClass}
        />
      </Field>

      <Field label="Business type" error={fieldError(fieldErrors, "business_type_id")}>
        <select
          value={state.businessTypeId ?? ""}
          onChange={(event) =>
            update("businessTypeId", event.target.value ? Number(event.target.value) : null)
          }
          className={inputClass}
        >
          <option value="">Select a type</option>
          {businessTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Contact person" error={fieldError(fieldErrors, "contact_person_name")}>
        <input
          value={state.contactPersonName}
          onChange={(event) => update("contactPersonName", event.target.value)}
          maxLength={255}
          className={inputClass}
        />
      </Field>

      <Field label="Description" error={fieldError(fieldErrors, "description")}>
        <textarea
          value={state.description}
          onChange={(event) => update("description", event.target.value)}
          rows={3}
          maxLength={2000}
          className={`${inputClass} h-auto resize-y py-2.5`}
        />
      </Field>

      <Field label="Categories" error={fieldError(fieldErrors, "categories")}>
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 && (
            <p className="text-sm text-text-muted">No active categories are configured yet.</p>
          )}
          {categories.map((category) => {
            const selected = state.categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                aria-pressed={selected}
                className={`flex min-h-11 items-center rounded-lg border px-3.5 text-sm transition duration-150 ${
                  selected
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border-subtle text-text-secondary hover:bg-surface-muted"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Cuisine types" error={fieldError(fieldErrors, "cuisine_types")}>
        <input
          value={state.cuisineTypes}
          onChange={(event) => update("cuisineTypes", event.target.value)}
          placeholder="Comma separated, e.g. Ghanaian, Grill"
          className={inputClass}
        />
      </Field>
    </StepBody>
  );
}

function LocationStep({ composer }: { composer: UseVendorComposer }) {
  const { state, update, fieldErrors } = composer;

  return (
    <StepBody title="Location" hint="Where the business trades from. Coordinates power the nearby search.">
      <Field label="Business address" error={fieldError(fieldErrors, "business_address")}>
        <input
          value={state.businessAddress}
          onChange={(event) => update("businessAddress", event.target.value)}
          maxLength={500}
          className={inputClass}
        />
      </Field>
      <Field label="City" error={fieldError(fieldErrors, "city")}>
        <input
          value={state.city}
          onChange={(event) => update("city", event.target.value)}
          maxLength={255}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Latitude" error={fieldError(fieldErrors, "latitude")}>
          <input
            type="number"
            step="any"
            min={-90}
            max={90}
            value={state.latitude}
            onChange={(event) => update("latitude", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Longitude" error={fieldError(fieldErrors, "longitude")}>
          <input
            type="number"
            step="any"
            min={-180}
            max={180}
            value={state.longitude}
            onChange={(event) => update("longitude", event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Delivery radius (km)" error={fieldError(fieldErrors, "delivery_radius_km")}>
        <input
          type="number"
          step="0.1"
          min={0}
          max={500}
          value={state.deliveryRadiusKm}
          onChange={(event) => update("deliveryRadiusKm", event.target.value)}
          className={inputClass}
        />
      </Field>
    </StepBody>
  );
}

function DeliveryStep({ composer }: { composer: UseVendorComposer }) {
  const { state, update, fieldErrors } = composer;

  return (
    <StepBody
      title="Delivery and timing"
      hint="Operating hours are set by the vendor, or from the vendor's detail page after creation."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Delivery fee (GHS)" error={fieldError(fieldErrors, "delivery_fee")}>
          <input
            type="number"
            step="0.01"
            min={0}
            value={state.deliveryFee}
            onChange={(event) => update("deliveryFee", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Minimum order (GHS)" error={fieldError(fieldErrors, "min_order")}>
          <input
            type="number"
            step="0.01"
            min={0}
            value={state.minOrder}
            onChange={(event) => update("minOrder", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Delivery time min (mins)" error={fieldError(fieldErrors, "delivery_time_min")}>
          <input
            type="number"
            min={1}
            max={600}
            value={state.deliveryTimeMin}
            onChange={(event) => update("deliveryTimeMin", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Delivery time max (mins)" error={fieldError(fieldErrors, "delivery_time_max")}>
          <input
            type="number"
            min={1}
            max={600}
            value={state.deliveryTimeMax}
            onChange={(event) => update("deliveryTimeMax", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Prep time (mins)" error={fieldError(fieldErrors, "estimated_prep_time_minutes")}>
          <input
            type="number"
            min={1}
            max={600}
            value={state.estimatedPrepTimeMinutes}
            onChange={(event) => update("estimatedPrepTimeMinutes", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Promo text" error={fieldError(fieldErrors, "promo_text")}>
          <input
            value={state.promoText}
            onChange={(event) => update("promoText", event.target.value)}
            maxLength={255}
            className={inputClass}
          />
        </Field>
      </div>
    </StepBody>
  );
}

function ReviewStep({
  composer,
  businessTypes,
}: {
  composer: UseVendorComposer;
  businessTypes: { id: number; name: string }[];
}) {
  const { state } = composer;
  const businessType = businessTypes.find((type) => type.id === state.businessTypeId);

  return (
    <StepBody title="Review" hint="Check the details before creating the vendor and its login.">
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <Summary label="Email" value={state.email} />
        <Summary label="Phone" value={state.phone} />
        <Summary label="Password" value={state.password ? "Set manually" : "Will be generated"} />
        <Summary label="Business name" value={state.businessName} />
        <Summary label="Business type" value={businessType?.name ?? "—"} />
        <Summary label="Contact person" value={state.contactPersonName} />
        <Summary label="Address" value={state.businessAddress} />
        <Summary label="City" value={state.city} />
        <Summary
          label="Categories"
          value={state.categories.length > 0 ? state.categories.join(", ") : "—"}
        />
        <Summary label="Delivery fee" value={state.deliveryFee || "Default"} />
        <Summary label="Minimum order" value={state.minOrder || "Default"} />
      </dl>
    </StepBody>
  );
}

function CreatedPanel({ vendorId, password }: { vendorId: number; password: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
      <h2 className="break-words text-base font-semibold text-foreground">Vendor created</h2>
      <p className="break-words text-sm text-text-secondary">
        Share this password with the vendor now — it is not stored anywhere and cannot be shown again.
        If it is lost, reset it from the vendor&apos;s account.
      </p>

      <output className="break-all rounded-lg border border-border-subtle bg-surface-muted px-4 py-3 font-mono text-sm text-foreground">
        {password}
      </output>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard/vendors/${vendorId}`}
          className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
        >
          Open vendor
        </Link>
        <Link
          href="/dashboard/vendors/all"
          className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          Back to vendors
        </Link>
      </div>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";

function StepBody({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="break-words text-base font-semibold text-foreground">{title}</h2>
        <p className="break-words text-sm text-text-secondary">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      {children}
      {error && <p className="break-words text-xs text-status-critical">{error}</p>}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className="break-words font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
