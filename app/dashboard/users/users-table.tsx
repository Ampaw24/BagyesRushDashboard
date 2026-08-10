"use client";

import { useMemo, useState } from "react";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { Avatar } from "../_components/avatar";
import { Badge } from "../_components/status-badge";
import { ActionMenu } from "../_components/action-menu";
import { EditIcon, EyeIcon, SearchIcon } from "../_lib/icons";
import { useCustomerActions } from "../_hooks/use-customer-actions";
import { adminRoleMeta, customerStatusMeta } from "../_lib/status";
import { formatCurrency, formatDate } from "../_lib/format";
import { EditCustomerDialog, type CustomerRole } from "./edit-customer-dialog";
import { ViewCustomerDialog } from "./view-customer-dialog";
import type { Customer } from "../_services/mock-data";
import type { Permission, RoleDefinition } from "../_services/administration-mock-data";

function roleLabel(role: CustomerRole): string {
  return role === "customer" ? "Customer" : adminRoleMeta[role].label;
}

function CustomerRow({
  customer,
  role,
  roles,
  permissions,
  onUpdate,
  onRoleChange,
  onDelete,
}: {
  customer: Customer;
  role: CustomerRole;
  roles: RoleDefinition[];
  permissions: Permission[];
  onUpdate: (updates: Partial<Customer>) => void;
  onRoleChange: (role: CustomerRole) => void;
  onDelete: () => void;
}) {
  const [viewing, setViewing] = useState(false);
  const [editing, setEditing] = useState(false);
  const { quickActions, deleteAction, dialog } = useCustomerActions(customer, onUpdate, onDelete);
  const promotableRoles = roles.filter((r) => !r.systemRole);

  return (
    <tr>
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <Avatar name={customer.name} />
          <span className="break-words">{customer.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-text-secondary">{customer.email}</TableCell>
      <TableCell className="text-text-secondary">{customer.phone}</TableCell>
      <TableCell>{customer.ordersCount}</TableCell>
      <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
      <TableCell className="text-text-secondary">{formatDate(customer.joinedAt)}</TableCell>
      <TableCell>
        <Badge meta={customerStatusMeta[customer.status]} />
      </TableCell>
      <TableCell className="text-text-secondary">{roleLabel(role)}</TableCell>
      <TableCell>
        <ActionMenu
          items={[
            { label: "View", icon: EyeIcon, onClick: () => setViewing(true) },
            { label: "Edit", icon: EditIcon, onClick: () => setEditing(true) },
            ...quickActions,
            deleteAction,
          ]}
        />
        {dialog}
        {viewing && <ViewCustomerDialog customer={customer} role={role} roleLabel={roleLabel(role)} onClose={() => setViewing(false)} />}
        {editing && (
          <EditCustomerDialog
            customer={customer}
            currentRole={role}
            promotableRoles={promotableRoles}
            permissions={permissions}
            onSave={(values) => {
              onUpdate({ name: values.name, email: values.email, phone: values.phone, status: values.status });
              onRoleChange(values.role);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        )}
      </TableCell>
    </tr>
  );
}

export function UsersTable({ customers: initialCustomers, roles, permissions }: { customers: Customer[]; roles: RoleDefinition[]; permissions: Permission[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [customerRoles, setCustomerRoles] = useState<Record<string, CustomerRole>>({});
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [customers, query]);

  function handleUpdate(id: string, updates: Partial<Customer>) {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }

  function handleRoleChange(id: string, role: CustomerRole) {
    setCustomerRoles((prev) => ({ ...prev, [id]: role }));
  }

  function handleDelete(id: string) {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-xs">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone, or ID"
          className="h-11 w-full rounded-lg border border-border-subtle bg-surface pl-9 pr-3.5 text-sm text-foreground outline-none transition duration-150 placeholder:text-text-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">No customers match your search</p>
        </div>
      ) : (
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
              <TableHeadCell>Role</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                role={customerRoles[customer.id] ?? "customer"}
                roles={roles}
                permissions={permissions}
                onUpdate={(updates) => handleUpdate(customer.id, updates)}
                onRoleChange={(role) => handleRoleChange(customer.id, role)}
                onDelete={() => handleDelete(customer.id)}
              />
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
