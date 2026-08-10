"use client";

import { useState } from "react";
import type { AdminRole } from "../_services/mock-data";
import type { Permission, RoleDefinition } from "../_services/administration-mock-data";

type PromoteCustomerDialogProps = {
  customerName: string;
  customerEmail: string;
  promotableRoles: RoleDefinition[];
  permissions: Permission[];
  onConfirm: (role: AdminRole) => void;
  onCancel: () => void;
};

export function PromoteCustomerDialog({ customerName, customerEmail, promotableRoles, permissions, onConfirm, onCancel }: PromoteCustomerDialogProps) {
  const [role, setRole] = useState<AdminRole>(promotableRoles[0]?.role ?? "support_staff");
  const selectedRole = promotableRoles.find((r) => r.role === role) ?? promotableRoles[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div role="dialog" aria-modal="true" aria-label="Promote customer to admin" className="relative flex w-full max-w-md flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-semibold text-foreground">You are about to promote</h2>
          <p className="break-words text-sm text-foreground">
            {customerName} <span className="text-text-muted">({customerEmail})</span>
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-surface-muted px-4 py-3 text-sm">
          <span className="text-text-muted">Current role</span>
          <span className="font-medium text-foreground">Customer</span>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-text-secondary">New role</p>
          {promotableRoles.map((r) => (
            <label key={r.role} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-border-subtle px-3 py-2">
              <input type="radio" name="new-role" checked={role === r.role} onChange={() => setRole(r.role)} className="h-4 w-4 accent-brand" />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{r.label}</span>
                <span className="text-xs text-text-muted">{r.description}</span>
              </span>
            </label>
          ))}
        </div>

        {selectedRole && (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-text-secondary">Permissions granted</p>
            <ul className="flex flex-col gap-1 rounded-lg bg-surface-muted p-3">
              {permissions
                .filter((p) => selectedRole.permissions.includes(p.key))
                .map((p) => (
                  <li key={p.key} className="text-xs text-text-secondary">
                    ☑ {p.label}
                  </li>
                ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-status-warning">This action will grant administrative access.</p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(role)}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            Confirm promotion
          </button>
        </div>
      </div>
    </div>
  );
}
