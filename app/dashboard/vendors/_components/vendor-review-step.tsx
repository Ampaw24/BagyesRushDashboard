"use client";

import Link from "next/link";
import { CheckCircleIcon } from "../../_lib/icons";
import { formatCurrency } from "../../_lib/format";
import type { Customer } from "../../_services/mock-data";
import type { UseVendorComposer } from "../../_hooks/use-vendor-composer";

export function VendorReviewStep({ composer, customers }: { composer: UseVendorComposer; customers: Customer[] }) {
  const { state, stepErrors, submit, submitStatus } = composer;
  const owner = customers.find((c) => c.id === state.ownerUserId);

  if (submitStatus.phase === "done") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
        <CheckCircleIcon className="h-10 w-10 text-status-good" />
        <p className="text-base font-semibold text-foreground">Vendor created</p>
        <p className="max-w-sm text-sm text-text-muted">{state.businessName} has been added as a pending vendor awaiting verification.</p>
        <div className="mt-2 flex gap-3">
          <Link
            href="/dashboard/vendors/all"
            className="flex h-10 items-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
          >
            View all vendors
          </Link>
          <Link
            href="/dashboard/vendors"
            className="flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            Back to overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Review vendor</p>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-muted">Business name</dt>
            <dd className="font-medium text-foreground">{state.businessName || "Untitled"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Category</dt>
            <dd className="font-medium text-foreground">{state.category}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Owner</dt>
            <dd className="font-medium text-foreground">{owner ? `${owner.name} (${owner.id})` : "Not selected"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Location</dt>
            <dd className="font-medium text-foreground">
              {state.address ? `${state.address}, ` : ""}
              {state.city || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Hours</dt>
            <dd className="font-medium text-foreground">
              {state.openingTime} – {state.closingTime} ({state.operatingDays.join(", ") || "No days selected"})
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Minimum order</dt>
            <dd className="font-medium text-foreground">{formatCurrency(state.minimumOrderAmount)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Fulfillment</dt>
            <dd className="font-medium text-foreground">
              {[state.deliveryAvailable && "Delivery", state.pickupAvailable && "Pickup"].filter(Boolean).join(" + ") || "None selected"}
            </dd>
          </div>
        </dl>
      </div>

      {stepErrors.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-lg bg-status-critical/10 p-3 text-xs text-status-critical">
          {stepErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/vendors/all"
          className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={() => submit()}
          disabled={submitStatus.phase === "submitting"}
          className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitStatus.phase === "submitting" ? "Creating…" : "Create vendor"}
        </button>
      </div>
    </div>
  );
}
