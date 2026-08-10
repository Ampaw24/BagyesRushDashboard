"use client";

import { useState } from "react";
import { Avatar } from "../_components/avatar";
import { customerStatusMeta } from "../_lib/status";
import type { AdminRole, Customer, CustomerStatus } from "../_services/mock-data";
import type { Permission, RoleDefinition } from "../_services/administration-mock-data";

export type CustomerRole = AdminRole | "customer";

export type EditCustomerValues = {
  name: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  role: CustomerRole;
};

type EditCustomerDialogProps = {
  customer: Customer;
  currentRole: CustomerRole;
  promotableRoles: RoleDefinition[];
  permissions: Permission[];
  onSave: (values: EditCustomerValues) => void;
  onCancel: () => void;
};

const STATUS_OPTIONS: CustomerStatus[] = ["active", "disabled", "banned"];

function inputClass() {
  return "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";
}

function labelClass() {
  return "text-sm font-medium text-text-secondary";
}

export function EditCustomerDialog({ customer, currentRole, promotableRoles, permissions, onSave, onCancel }: EditCustomerDialogProps) {
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone);
  const [status, setStatus] = useState<CustomerStatus>(customer.status);
  const [role, setRole] = useState<CustomerRole>(currentRole);

  const selectedRoleDef = role === "customer" ? null : promotableRoles.find((r) => r.role === role);
  const isElevating = role !== "customer" && currentRole === "customer";

  function handleSave() {
    onSave({ name, email, phone, status, role });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit customer"
        className="relative flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Avatar name={name || customer.name} className="h-11 w-11 text-sm" />
          <h2 className="text-base font-semibold text-foreground">Edit customer</h2>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-name" className={labelClass()}>
            Name
          </label>
          <input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass()} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-email" className={labelClass()}>
            Email
          </label>
          <input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass()} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-phone" className={labelClass()}>
            Phone
          </label>
          <input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass()} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-status" className={labelClass()}>
            Status
          </label>
          <select id="edit-status" value={status} onChange={(e) => setStatus(e.target.value as CustomerStatus)} className={inputClass()}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {customerStatusMeta[s].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-role" className={labelClass()}>
            Role
          </label>
          <select id="edit-role" value={role} onChange={(e) => setRole(e.target.value as CustomerRole)} className={inputClass()}>
            <option value="customer">Customer — no admin access</option>
            {promotableRoles.map((r) => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {selectedRoleDef && (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-text-secondary">Permissions granted</p>
            <ul className="flex flex-col gap-1 rounded-lg bg-surface-muted p-3">
              {permissions
                .filter((p) => selectedRoleDef.permissions.includes(p.key))
                .map((p) => (
                  <li key={p.key} className="text-xs text-text-secondary">
                    ☑ {p.label}
                  </li>
                ))}
            </ul>
            {isElevating && <p className="text-sm text-status-warning">This grants administrative dashboard access.</p>}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
