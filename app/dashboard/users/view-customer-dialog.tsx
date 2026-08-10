"use client";

import { Avatar } from "../_components/avatar";
import { Badge } from "../_components/status-badge";
import { customerStatusMeta } from "../_lib/status";
import { formatCurrency, formatDate } from "../_lib/format";
import type { Customer } from "../_services/mock-data";
import type { CustomerRole } from "./edit-customer-dialog";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className="break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function ViewCustomerDialog({ customer, role, roleLabel, onClose }: { customer: Customer; role: CustomerRole; roleLabel: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="View customer" className="relative flex w-full max-w-md flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={customer.name} className="h-11 w-11 text-sm" />
            <h2 className="text-base font-semibold text-foreground">{customer.name}</h2>
          </div>
          <Badge meta={customerStatusMeta[customer.status]} />
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Field label="Email" value={customer.email} />
          <Field label="Phone" value={customer.phone} />
          <Field label="Orders" value={customer.ordersCount} />
          <Field label="Total spent" value={formatCurrency(customer.totalSpent)} />
          <Field label="Joined" value={formatDate(customer.joinedAt)} />
          <Field label="Role" value={role === "customer" ? "Customer" : roleLabel} />
        </dl>

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
