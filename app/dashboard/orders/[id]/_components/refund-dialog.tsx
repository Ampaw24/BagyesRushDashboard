"use client";

import { useState } from "react";

import { useToast } from "../../../_components/toast-provider";
import { formatCurrency } from "../../../_lib/format";
import { refundOrderAction } from "../../_actions";
import type { OrderDetail } from "@/lib/mappers/order.mapper";

/**
 * How much goes back, and where to.
 *
 * Its own dialog rather than the shared ConfirmDialog because a refund is two
 * decisions, not a yes. Both default the safe way — the whole remaining amount,
 * back to the card or mobile money it came from — so the common case is still
 * one click past open.
 *
 * The presets are computed by the backend from this order's own figures. That
 * matters more than it looks: the alternative is somebody on a support call
 * doing "total minus delivery fee" in their head and typing it in, which is
 * where refund mistakes actually come from.
 */
export function RefundDialog({ order, onClose }: { order: OrderDetail; onClose: () => void }) {
  const { notifySuccess } = useToast();
  const remaining = order.refund.refundableRemaining;

  const [amount, setAmount] = useState(String(remaining));
  const [destination, setDestination] = useState<"source" | "wallet">("source");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const parsed = Number(amount);
  const invalid = !Number.isFinite(parsed) || parsed <= 0 || parsed > remaining;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (invalid) return;

    setPending(true);
    setError("");

    const result = await refundOrderAction(order.id, {
      amount: parsed,
      destination,
      reason: reason.trim() || undefined,
    });

    setPending(false);
    notifySuccess(result);

    if (result.ok) onClose();
    else setError(result.message);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="Refund order"
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <div>
          <h2 className="break-words text-base font-semibold text-foreground">
            Refund order {order.orderNumber}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {formatCurrency(remaining)} of {formatCurrency(order.total)} is still refundable
            {order.refund.refunded > 0 && ` — ${formatCurrency(order.refund.refunded)} has already gone back`}.
          </p>
        </div>

        {order.refund.paidFromWallet > 0 && (
          <p className="break-words rounded-lg border border-border-subtle bg-surface-muted px-3.5 py-2.5 text-sm text-text-secondary">
            {formatCurrency(order.refund.paidFromWallet)} of this order was paid with wallet credit.
            That part returns to the wallet on its own when the order ends, so it is not part of the
            figure above.
          </p>
        )}

        {order.refund.presets.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Common splits</span>
            <div className="flex flex-wrap gap-2">
              {order.refund.presets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setAmount(String(preset.amount))}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition duration-150 ${
                    Number(amount) === preset.amount
                      ? "border-brand bg-brand/5 text-foreground"
                      : "border-border-subtle text-text-secondary hover:bg-surface-muted"
                  }`}
                >
                  <span className="block font-medium text-foreground">
                    {formatCurrency(preset.amount)}
                  </span>
                  <span className="block text-xs">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Amount</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={remaining}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            className="h-11 rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
          {invalid && amount !== "" && (
            <span className="text-xs text-status-critical">
              Enter an amount between {formatCurrency(0.01)} and {formatCurrency(remaining)}.
            </span>
          )}
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">Where does it go?</legend>

          <DestinationOption
            checked={destination === "source"}
            onSelect={() => setDestination("source")}
            title="Back to the original payment method"
            description="A real reversal at the payment provider. The platform keeps nothing. Card refunds can take a few working days to appear."
          />
          <DestinationOption
            checked={destination === "wallet"}
            onSelect={() => setDestination("wallet")}
            title="To wallet credit"
            description="Instant, and it cannot fail — but the money stays on the platform. Right for a goodwill gesture, wrong for somebody who is not coming back."
          />
        </fieldset>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Reason (optional)</span>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={255}
            placeholder="Rider could not reach the customer"
            className="h-11 rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
          <span className="text-xs text-text-muted">
            Recorded on the audit trail, and used as the cancellation reason if this refund closes
            the order.
          </span>
        </label>

        {error && (
          <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || invalid}
            className="flex h-11 items-center rounded-lg bg-status-critical px-5 text-sm font-medium text-white transition duration-150 hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Refunding…" : `Refund ${formatCurrency(parsed || 0)}`}
          </button>
        </div>
      </form>
    </div>
  );
}

function DestinationOption({
  checked,
  onSelect,
  title,
  description,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-lg border px-3.5 py-3 text-sm transition duration-150 ${
        checked ? "border-brand bg-brand/5" : "border-border-subtle hover:bg-surface-muted"
      }`}
    >
      <input
        type="radio"
        name="destination"
        checked={checked}
        onChange={onSelect}
        className="mt-1 h-4 w-4 shrink-0 accent-brand"
      />
      <span>
        <span className="block font-medium text-foreground">{title}</span>
        <span className="block text-text-secondary">{description}</span>
      </span>
    </label>
  );
}
