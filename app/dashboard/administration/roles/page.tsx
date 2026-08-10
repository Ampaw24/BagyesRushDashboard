import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { RolesMatrix } from "./roles-matrix";
import { getPermissions, getRoles } from "../../_services/administration-mock-data";

export const metadata: Metadata = {
  title: "Roles — Bagyes Rush Delivery",
};

export default async function RolesPage() {
  const [roles, permissions] = await Promise.all([getRoles(), getPermissions()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Roles" description="Which permissions each dashboard role grants. Super Admin is locked and always has full access." />
      <RolesMatrix roles={roles} permissions={permissions} />
    </div>
  );
}
