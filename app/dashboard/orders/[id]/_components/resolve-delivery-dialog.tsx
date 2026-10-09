"use client";

import { useState, useTransition } from "react";

import { TextAreaField } from "../../../_components/form-field";
import { useToast } from "../../../_components/toast-provider";
import { resolveFailedDeliveryAction } from "../../_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { OrderDetail } from "@/lib/mappers/order.mapper";
import type { DeliveryResolution } from "@/lib/types/enums";

/**
 * The decision a failed doorstep is waiting on.
 *
 * The options come from the API (`arrival.resolution_options`), so a parcel is
 * never offered "customer no-show" and food is never offered "return to
 * sender". "Our fault" refunds the customer, so it is only selectable for
 * somebody holding payments.refund — the backend refuses it otherwise.
 */
export function ResolveDeliveryButton({
  order,
  canRefund,
}: {
  order: OrderDetail;
  canRefund: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (order.arrival.resolutionOptions.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-fit items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
      >
        Resolve delivery
      </button>
      {open && <ResolveDeliveryDialog order={order} canRefund={canRefund} onClose={() => setOpen(false)} />}
    </>
  );
}

function ResolveDeliveryDialog({
  order,
  canRefund,
  onClose,
}: {
  order: OrderDetail;
  canRefund: boolean;
  onClose: () => void;
}) {
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState("");

  const options = order.arrival.resolutionOptions;
  const [outcome, setOutcome] = useState<DeliveryResolution>(options[0].value);
  const [note, setNote] = useState("");
  const [payRider, setPayRider] = useState(false);

  function save() {
    startTransition(async () => {
      setErrors({});
      setFailure("");

      const result = await resolveFailedDeliveryAction(order.id, {
        outcome,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(outcome === "our_fault" ? { pay_rider: payRider } : {}),
      });

      notify(result);

      if (result.ok) {
        onClose();
        return;
      }

      setErrors(result.errors);
      setFailure(result.message);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={pending ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Resolve failed delivery"
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col gap-5 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="break-words text-base font-semibold text-foreground">
            Resolve {order.orderNumber}
          </h2>
          <p className="break-words text-sm text-text-secondary">
            The rider was at the address and waited the full time, so by default the customer is
            the one responsible.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Outcome</legend>
          {options.map((option) => {
            const locked = option.refundsCustomer && !canRefund;

            return (
              <label
                key={option.value}
                className={`flex min-h-11 items-start gap-3 rounded-lg border p-3 transition duration-150 ${
                  outcome === option.value
                    ? "border-brand bg-brand/5"
                    : "border-border-subtle hover:bg-surface-muted"
                } ${locked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <input
                  type="radio"
                  name="outcome"
                  value={option.value}
                  checked={outcome === option.value}
                  disabled={pending || locked}
                  onChange={() => setOutcome(option.value)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand)]"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                  <span className="break-words text-xs text-text-secondary">
                    {locked ? "Needs the refund permission." : option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
        {fieldError(errors, "outcome") && (
          <p className="break-words text-xs text-status-critical">{fieldError(errors, "outcome")}</p>
        )}

        {outcome === "our_fault" && (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={payRider}
              disabled={pending}
              onChange={(event) => setPayRider(event.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-border-subtle accent-[var(--brand)]"
            />
            Still pay the rider for the trip
          </label>
        )}

        <TextAreaField
          id="resolution_note"
          label="Note"
          value={note}
          onChange={setNote}
          rows={2}
          placeholder="What you checked, e.g. called the customer twice"
          error={fieldError(errors, "note")}
          disabled={pending}
        />

        {failure && (
          <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
            {failure}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:opacity-70"
          >
            {pending ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
