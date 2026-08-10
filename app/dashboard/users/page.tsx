import type { Metadata } from "next";
import { PageHeader } from "../_components/page-header";
import { UsersTable } from "./users-table";
import { getCustomers } from "../_services/mock-data";
import { getPermissions, getRoles } from "../_services/administration-mock-data";

export const metadata: Metadata = {
  title: "Users — Bagyes Rush Delivery",
};

export default async function UsersPage() {
  const [customers, roles, permissions] = await Promise.all([getCustomers(), getRoles(), getPermissions()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users" description="Customers ordering through Bagyes Rush." />
      <UsersTable customers={customers} roles={roles} permissions={permissions} />
    </div>
  );
}
