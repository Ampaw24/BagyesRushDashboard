"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { Avatar } from "../_components/avatar";
import { Badge } from "../_components/status-badge";
import { ActionMenu } from "../_components/action-menu";
import { useAdminActions } from "../_hooks/use-admin-actions";
import { EditIcon, SearchIcon } from "../_lib/icons";
import { adminRoleMeta, adminStatusMeta } from "../_lib/status";
import { formatDateTime } from "../_lib/format";
import type { AdminUser } from "../_services/mock-data";

function AdminRow({ admin, activeSuperAdminCount, onUpdate }: { admin: AdminUser; activeSuperAdminCount: number; onUpdate: (updates: Partial<AdminUser>) => void }) {
  const router = useRouter();
  const { actions, dialog } = useAdminActions(admin, activeSuperAdminCount, onUpdate);

  return (
    <tr>
      <TableCell className="font-medium">
        <Link href={`/dashboard/administration/admins/${admin.id}`} className="flex items-center gap-3 hover:text-brand">
          <Avatar name={admin.name} />
          <span className="break-words">{admin.name}</span>
        </Link>
      </TableCell>
      <TableCell className="text-text-secondary">{admin.email}</TableCell>
      <TableCell className="text-text-secondary">{adminRoleMeta[admin.role].label}</TableCell>
      <TableCell>
        <Badge meta={adminStatusMeta[admin.status]} />
      </TableCell>
      <TableCell className="text-text-secondary">{formatDateTime(admin.lastActive)}</TableCell>
      <TableCell>
        <ActionMenu
          items={[{ label: "View / change role", icon: EditIcon, onClick: () => router.push(`/dashboard/administration/admins/${admin.id}`) }, ...actions]}
        />
        {dialog}
      </TableCell>
    </tr>
  );
}

export function AdminUsersTable({ admins: initialAdmins }: { admins: AdminUser[] }) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [query, setQuery] = useState("");

  const activeSuperAdminCount = useMemo(() => admins.filter((a) => a.role === "super_admin" && a.status === "active").length, [admins]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return admins;
    return admins.filter((a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
  }, [admins, query]);

  function handleUpdate(id: string, updates: Partial<AdminUser>) {
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-xs">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email"
          className="h-11 w-full rounded-lg border border-border-subtle bg-surface pl-9 pr-3.5 text-sm text-foreground outline-none transition duration-150 placeholder:text-text-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </div>

      <TableShell>
        <thead>
          <tr>
            <TableHeadCell>Name</TableHeadCell>
            <TableHeadCell>Email</TableHeadCell>
            <TableHeadCell>Role</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Last active</TableHeadCell>
            <TableHeadCell>Actions</TableHeadCell>
          </tr>
        </thead>
        <tbody>
          {filtered.map((admin) => (
            <AdminRow key={admin.id} admin={admin} activeSuperAdminCount={activeSuperAdminCount} onUpdate={(updates) => handleUpdate(admin.id, updates)} />
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}
