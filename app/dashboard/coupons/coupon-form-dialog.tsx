"use client";

import { useState, type FormEvent } from "react";

import { savePromoCodeAction } from "./_actions";
import { useToast } from "../_components/toast-provider";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import {
  PROMO_CODE_SCOPES,
  PROMO_CODE_TYPES,
  promoCodeScopeLabels,
  promoCodeTypeLabels,
  type PromoCodeScope,
  type PromoCodeType,
} from "@/lib/types/enums";
import type { PromoCodeRow } from "@/lib/mappers/promo-code.mapper";

/** `<input type="date">` wants YYYY-MM-DD; the API returns a full ISO string. */
function toDateInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

/**
 * Create / edit form for a promo code.
 *
 * The cross-field rules are mirrored here for immediate feedback, but the
 * backend re-validates all of them and its 422 `errors` are rendered per field
 * — the client checks are a convenience, not the authority.
 */
export function CouponFormDialog({
  coupon,
  onClose,
  onSaved,
}: {
  /** null when creating. */
  coupon: PromoCodeRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<PromoCodeType>(coupon?.type ?? "percentage");
  const [scope, setScope] = useState<PromoCodeScope>(coupon?.scope ?? "platform");
  const [pending, setPending] = useState(false);
  const { notifySuccess } = useToast();
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setPending(true);
    setMessage("");
    setErrors({});

    const numberOrNull = (key: string) => {
      const raw = String(form.get(key) ?? "").trim();
      return raw === "" ? null : Number(raw);
    };
    // For the NOT NULL columns: omit the key entirely so the database default
    // applies. JSON.stringify drops undefined values, so the field never ships.
    const numberOrOmit = (key: string) => {
      const raw = String(form.get(key) ?? "").trim();
      return raw === "" ? undefined : Number(raw);
    };
    const textOrNull = (key: string) => {
      const raw = String(form.get(key) ?? "").trim();
      return raw === "" ? null : raw;
    };

    const result = await savePromoCodeAction(coupon?.id ?? null, {
      code: String(form.get("code") ?? "").trim(),
      description: textOrNull("description"),
      type,
      value: numberOrOmit("value"),
      max_discount: numberOrNull("max_discount"),
      min_order_amount: numberOrOmit("min_order_amount"),
      scope,
      vendor_id: scope === "vendor" ? numberOrNull("vendor_id") : null,
      category_id: scope === "category" ? numberOrNull("category_id") : null,
      starts_at: textOrNull("starts_at"),
      ends_at: textOrNull("ends_at"),
      max_redemptions: numberOrNull("max_redemptions"),
      max_per_customer: numberOrNull("max_per_customer"),
      is_active: form.get("is_active") !== null,
      is_public: form.get("is_public") !== null,
    });

    setPending(false);
    notifySuccess(result);

    if (result.ok) {
      onSaved();
      return;
    }

    setMessage(result.message);
    setErrors(result.errors);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={pending ? undefined : onClose} />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={coupon ? "Edit promo code" : "New promo code"}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <h2 className="break-words text-base font-semibold text-foreground">
          {coupon ? `Edit ${coupon.code}` : "New promo code"}
        </h2>

        <Field label="Code" error={fieldError(errors, "code")}>
          <input
            name="code"
            required
            defaultValue={coupon?.code ?? ""}
            // Matches the backend regex: letters, digits, dash, underscore.
            pattern="[A-Za-z0-9_\-]+"
            maxLength={32}
            className={inputClass}
          />
        </Field>

        <Field label="Description" error={fieldError(errors, "description")}>
          <input name="description" defaultValue={coupon?.description ?? ""} maxLength={255} className={inputClass} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type" error={fieldError(errors, "type")}>
            <select
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value as PromoCodeType)}
              className={inputClass}
            >
              {PROMO_CODE_TYPES.map((option) => (
                <option key={option} value={option}>
                  {promoCodeTypeLabels[option]}
                </option>
              ))}
            </select>
          </Field>

          {/* A free-delivery code carries no value, so the field is hidden. */}
          {type !== "free_delivery" && (
            <Field
              label={type === "percentage" ? "Percentage (1–100)" : "Amount (GHS)"}
              error={fieldError(errors, "value")}
            >
              <input
                name="value"
                type="number"
                step="0.01"
                min={type === "percentage" ? 1 : 0.01}
                max={type === "percentage" ? 100 : undefined}
                required
                defaultValue={coupon?.value ?? ""}
                className={inputClass}
              />
            </Field>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Max discount (GHS)" error={fieldError(errors, "max_discount")}>
            <input
              name="max_discount"
              type="number"
              step="0.01"
              min={0}
              defaultValue={coupon?.maxDiscount ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Minimum order (GHS)" error={fieldError(errors, "min_order_amount")}>
            <input
              name="min_order_amount"
              type="number"
              step="0.01"
              min={0}
              defaultValue={coupon?.minOrderAmount ?? ""}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Scope" error={fieldError(errors, "scope")}>
          <select
            name="scope"
            value={scope}
            onChange={(event) => setScope(event.target.value as PromoCodeScope)}
            className={inputClass}
          >
            {PROMO_CODE_SCOPES.map((option) => (
              <option key={option} value={option}>
                {promoCodeScopeLabels[option]}
              </option>
            ))}
          </select>
        </Field>

        {scope === "vendor" && (
          <Field label="Vendor ID" error={fieldError(errors, "vendor_id")}>
            <input name="vendor_id" type="number" min={1} required defaultValue={coupon?.vendorId ?? ""} className={inputClass} />
          </Field>
        )}

        {scope === "category" && (
          <Field label="Category ID" error={fieldError(errors, "category_id")}>
            <input name="category_id" type="number" min={1} required defaultValue={coupon?.categoryId ?? ""} className={inputClass} />
          </Field>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Starts" error={fieldError(errors, "starts_at")}>
            <input name="starts_at" type="date" defaultValue={toDateInput(coupon?.startsAt ?? null)} className={inputClass} />
          </Field>
          <Field label="Ends" error={fieldError(errors, "ends_at")}>
            <input name="ends_at" type="date" defaultValue={toDateInput(coupon?.endsAt ?? null)} className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Max redemptions" error={fieldError(errors, "max_redemptions")}>
            <input name="max_redemptions" type="number" min={1} defaultValue={coupon?.maxRedemptions ?? ""} className={inputClass} />
          </Field>
          <Field label="Max per customer" error={fieldError(errors, "max_per_customer")}>
            <input name="max_per_customer" type="number" min={1} defaultValue={coupon?.maxPerCustomer ?? ""} className={inputClass} />
          </Field>
        </div>

        <label className="flex min-h-11 items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={coupon?.isActive ?? true}
            className="h-4 w-4 rounded border-border-subtle text-brand focus:ring-brand"
          />
          Active
        </label>

        {/* Off by default. A code handed to twenty people is targeted, and
            listing it publicly would be giving it away. */}
        <label className="flex min-h-11 items-start gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            name="is_public"
            defaultChecked={coupon?.isPublic ?? false}
            className="mt-0.5 h-4 w-4 rounded border-border-subtle text-brand focus:ring-brand"
          />
          <span>
            Advertise publicly
            <span className="block text-xs text-text-muted">
              Shows in the apps&rsquo; offers list. Leave off for a code you are handing to specific
              customers — listing it there gives it to everybody.
            </span>
          </span>
        </label>

        {message && (
          <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
            {message}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:opacity-70"
          >
            {pending ? "Saving…" : coupon ? "Save changes" : "Create code"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";

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
