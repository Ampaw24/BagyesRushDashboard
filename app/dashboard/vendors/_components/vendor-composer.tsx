"use client";

import { VENDOR_COMPOSER_STEPS, useVendorComposer } from "../../_hooks/use-vendor-composer";
import { ProgressSteps } from "../../_components/progress-steps";
import { VendorBusinessStep } from "./vendor-business-step";
import { VendorOwnerStep } from "./vendor-owner-step";
import { VendorLocationStep } from "./vendor-location-step";
import { VendorOperatingStep } from "./vendor-operating-step";
import { VendorReviewStep } from "./vendor-review-step";
import type { Customer } from "../../_services/mock-data";

export function VendorComposer({ customers }: { customers: Customer[] }) {
  const composer = useVendorComposer();
  const { state, stepErrors, next, back, goToStep, submitStatus } = composer;
  const isReviewStep = state.step === VENDOR_COMPOSER_STEPS.length - 1;

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm sm:p-6">
      <ProgressSteps steps={VENDOR_COMPOSER_STEPS} currentStep={state.step} onStepClick={goToStep} />

      {state.step === 0 && <VendorBusinessStep composer={composer} />}
      {state.step === 1 && <VendorOwnerStep composer={composer} customers={customers} />}
      {state.step === 2 && <VendorLocationStep composer={composer} />}
      {state.step === 3 && <VendorOperatingStep composer={composer} />}
      {state.step === 4 && <VendorReviewStep composer={composer} customers={customers} />}

      {!isReviewStep && (
        <div className="flex items-center justify-between border-t border-border-subtle pt-5">
          <button
            type="button"
            onClick={back}
            disabled={state.step === 0}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <div className="flex flex-col items-end gap-1">
            {stepErrors.length > 0 && <p className="text-xs text-status-critical">{stepErrors[0]}</p>}
            <button
              type="button"
              onClick={next}
              disabled={stepErrors.length > 0 || submitStatus.phase === "submitting"}
              className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
