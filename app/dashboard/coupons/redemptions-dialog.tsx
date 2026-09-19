"use client";

import { useEffect, useState } from "react";

import { formatCurrency, formatDateTime } from "../_lib/format";
import { loadRedemptionsAction } from "./_actions";
import type { PromoCodeRow } from "@/lib/mappers/promo-code.mapper";

type Redemption = {
  id: number;
  discount: number;
  customerName: string;
  orderNumber: string | null;
  orderTotal: number | null;
  redeemedAt: string | null;
};

/**
 * Who actually used a code.
 *
 * The table shows a redemption count, which says a campaign was used and
 * nothing about whether it worked or who worked it. This is what makes a
 * campaign measurable — and what makes one customer taking a code twenty times
 * visible.
 */
export function RedemptionsDialog({
  coupon,
  onClose,
}: {
  coupon: PromoCodeRow;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<Redemption[] | null>(null);
  const [total, setTotal] = useState(0);
  const [failure, setFailure] = useState("");

  useEffect(() => {
    let cancelled = false;

    loadRedemptionsAction(coupon.id).then((result) => {
      if (cancelled) return;

      if (!result.ok) {
        setFailure(result.message);
        setRows([]);
        return;
      }

      setRows(result.data.items);
      setTotal(result.data.total);
    });

    return () => {
      cancelled = true;
    };
  }, [coupon.id]);

  const spend = (rows ?? []).reduce((sum, row) => sum + row.discount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Redemptions for ${coupon.code}`}
        className="relative flex max-h-[85vh] w-full max-w-3xl flex-col gap-4 overflow-hidden rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="break-words text-base font-semibold text-foreground">
            {coupon.code} &middot; redemptions
          </h2>
          <p className="break-words text-sm text-text-secondary">
            {total.toLocaleString()} use{total === 1 ? "" : "s"}
            {rows !== null && rows.length > 0 && (
              <> &middot; {formatCurrency(spend)} given away on this page</>
            )}
          </p>
        </div>

        {failure && (
          <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
            {failure}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border-subtle">
          {rows === null ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted">Loading&hellip;</p>
          ) : rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted">
              {failure ? "Could not load redemptions." : "Nobody has used this code yet."}
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium text-text-secondary">Customer</th>
                  <th className="px-4 py-2.5 font-medium text-text-secondary">Order</th>
                  <th className="px-4 py-2.5 font-medium text-text-secondary">Discount</th>
                  <th className="px-4 py-2.5 font-medium text-text-secondary">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border-subtle">
                    <td className="px-4 py-2.5 text-foreground">{row.customerName}</td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {row.orderNumber ?? "—"}
                      {row.orderTotal !== null && (
                        <span className="text-text-muted"> &middot; {formatCurrency(row.orderTotal)}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">{formatCurrency(row.discount)}</td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {row.redeemedAt ? formatDateTime(new Date(row.redeemedAt)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
