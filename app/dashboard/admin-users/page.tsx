import type { Metadata } from "next";
import { PageHeader } from "../_components/page-header";
import { AdminUsersTable } from "./admin-users-table";
import { getAdminUsers } from "../_services/mock-data";

export const metadata: Metadata = {
  title: "Admin Users — Bagyes Rush Delivery",
};

export default async function AdminUsersPage() {
  const admins = await getAdminUsers();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Admin users" description="People with access to this dashboard." />
      <AdminUsersTable admins={admins} />
    </div>
  );
}
