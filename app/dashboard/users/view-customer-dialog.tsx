"use client";

import { useEffect, useState } from "react";

import { Avatar } from "../_components/avatar";
import { Badge } from "../_components/status-badge";
import { userStatusMeta } from "../_lib/status";
import { formatCurrency, formatDate, formatDateTimeOrDash } from "../_lib/format";
import { loadCustomerDetailAction } from "./_actions";
import type { CustomerDetail, CustomerRow } from "@/lib/mappers/customer.mapper";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className="break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Opens with the row data already in hand, then fills in the spend summary
 * from `GET /admin/customers/{id}` — the list endpoint does not include it.
 */
export function ViewCustomerDialog({ customer, onClose }: { customer: CustomerRow; onClose: () => void }) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    loadCustomerDetailAction(customer.id).then((result) => {
      if (!active) return;
      if (result.ok) setDetail(result.data);
      else setError(result.message);
    });

    return () => {
      active = false;
    };
  }, [customer.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="View customer"
        className="relative flex w-full max-w-md flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={customer.fullName} className="h-11 w-11 text-sm" />
            <h2 className="break-words text-base font-semibold text-foreground">{customer.fullName}</h2>
          </div>
          <Badge meta={userStatusMeta[customer.status]} />
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Field label="Email" value={customer.email ?? "—"} />
          <Field label="Phone" value={customer.phone ?? "—"} />
          <Field label="Phone verified" value={customer.phoneVerified ? "Yes" : "No"} />
          <Field label="Joined" value={formatDate(customer.joinedAt)} />
          <Field label="Referral code" value={customer.referralCode ?? "—"} />
          <Field label="Referrals" value={customer.referralCount} />

          {detail ? (
            <>
              <Field label="Orders placed" value={detail.summary.ordersPlaced} />
              <Field label="Delivered" value={detail.summary.ordersDelivered} />
              <Field label="Cancelled" value={detail.summary.ordersCancelled} />
              <Field label="Lifetime value" value={formatCurrency(detail.summary.lifetimeValue)} />
              <Field label="Last ordered" value={formatDateTimeOrDash(detail.summary.lastOrderedAt)} />
            </>
          ) : (
            !error && <Field label="Order history" value={<span className="text-text-muted">Loading…</span>} />
          )}
        </dl>

        {error && (
          <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
            {error}
          </p>
        )}

        <div className="flex justify-end pt-2">
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
