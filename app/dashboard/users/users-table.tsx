"use client";

import { useState } from "react";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { Badge } from "../_components/status-badge";
import { customerStatusMeta } from "../_lib/status";
import { formatCurrency, formatDate } from "../_lib/format";
import { PromoteCustomerDialog } from "./promote-customer-dialog";
import type { AdminRole, Customer } from "../_services/mock-data";
import type { Permission, RoleDefinition } from "../_services/administration-mock-data";

export function UsersTable({ customers, roles, permissions }: { customers: Customer[]; roles: RoleDefinition[]; permissions: Permission[] }) {
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());
  const [promotedRole, setPromotedRole] = useState<Record<string, AdminRole>>({});

  const promotingCustomer = customers.find((c) => c.id === promotingId);
  const promotableRoles = roles.filter((r) => !r.systemRole);

  function handleConfirm(role: AdminRole) {
    if (!promotingId) return;
    setPromotedIds((prev) => new Set(prev).add(promotingId));
    setPromotedRole((prev) => ({ ...prev, [promotingId]: role }));
    setPromotingId(null);
  }

  return (
    <>
      <TableShell>
        <thead>
          <tr>
            <TableHeadCell>Customer</TableHeadCell>
            <TableHeadCell>Email</TableHeadCell>
            <TableHeadCell>Phone</TableHeadCell>
            <TableHeadCell>Orders</TableHeadCell>
            <TableHeadCell>Total spent</TableHeadCell>
            <TableHeadCell>Joined</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Actions</TableHeadCell>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => {
            const isPromoted = promotedIds.has(customer.id);
            return (
              <tr key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="text-text-secondary">{customer.email}</TableCell>
                <TableCell className="text-text-secondary">{customer.phone}</TableCell>
                <TableCell>{customer.ordersCount}</TableCell>
                <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                <TableCell className="text-text-secondary">{formatDate(customer.joinedAt)}</TableCell>
                <TableCell>
                  <Badge meta={customerStatusMeta[customer.status]} />
                </TableCell>
                <TableCell>
                  {isPromoted ? (
                    <span className="text-xs font-medium text-status-good">
                      Promoted to {roles.find((r) => r.role === promotedRole[customer.id])?.label}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPromotingId(customer.id)}
                      className="flex h-9 items-center rounded-lg border border-border-subtle px-3 text-xs font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
                    >
                      Promote to admin
                    </button>
                  )}
                </TableCell>
              </tr>
            );
          })}
        </tbody>
      </TableShell>

      {promotingCustomer && (
        <PromoteCustomerDialog
          customerName={promotingCustomer.name}
          customerEmail={promotingCustomer.email}
          promotableRoles={promotableRoles}
          permissions={permissions}
          onConfirm={handleConfirm}
          onCancel={() => setPromotingId(null)}
        />
      )}
    </>
  );
}
