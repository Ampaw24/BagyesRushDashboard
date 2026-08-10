import type { Metadata } from "next";
import { PageHeader } from "../_components/page-header";
import { StatTile } from "../_components/stat-tile";
import { UsersTable } from "./users-table";
import { ProfileDeleteIcon, UsersIcon, XCircleIcon } from "../_lib/icons";
import { formatCompactNumber } from "../_lib/format";
import { getCustomers, getCustomersOverviewStats } from "../_services/mock-data";
import { getPermissions, getRoles } from "../_services/administration-mock-data";

export const metadata: Metadata = {
  title: "Users — Bagyes Rush Delivery",
};

export default async function UsersPage() {
  const [customers, roles, permissions, stats] = await Promise.all([
    getCustomers(),
    getRoles(),
    getPermissions(),
    getCustomersOverviewStats(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users" description="Customers ordering through Bagyes Rush." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Total customers" value={formatCompactNumber(stats.total)} icon={<UsersIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Disabled customers" value={formatCompactNumber(stats.disabled)} icon={<XCircleIcon className="h-4.5 w-4.5" />} />
        <StatTile label="Banned customers" value={formatCompactNumber(stats.banned)} icon={<ProfileDeleteIcon className="h-4.5 w-4.5" />} />
      </div>

      <UsersTable customers={customers} roles={roles} permissions={permissions} />
    </div>
  );
}
