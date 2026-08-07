import type { Metadata } from "next";
import { PageHeader } from "../_components/page-header";
import { Badge } from "../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { adminRoleMeta, adminStatusMeta } from "../_lib/status";
import { formatDateTime } from "../_lib/format";
import { getAdminUsers } from "../_services/mock-data";

export const metadata: Metadata = {
  title: "Admin Users — Bagyes Rush Delivery",
};

export default async function AdminUsersPage() {
  const admins = await getAdminUsers();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Admin users" description="People with access to this dashboard." />

      <TableShell>
        <thead>
          <tr>
            <TableHeadCell>Name</TableHeadCell>
            <TableHeadCell>Email</TableHeadCell>
            <TableHeadCell>Role</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Last active</TableHeadCell>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id}>
              <TableCell className="font-medium">{admin.name}</TableCell>
              <TableCell className="text-text-secondary">{admin.email}</TableCell>
              <TableCell className="text-text-secondary">{adminRoleMeta[admin.role].label}</TableCell>
              <TableCell>
                <Badge meta={adminStatusMeta[admin.status]} />
              </TableCell>
              <TableCell className="text-text-secondary">{formatDateTime(admin.lastActive)}</TableCell>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}
