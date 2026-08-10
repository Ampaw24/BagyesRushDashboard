import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { AuditLogTable } from "../_components/audit-log-table";
import { getRoleChangeLogs } from "../../_services/administration-mock-data";

export const metadata: Metadata = {
  title: "Role Changes — Bagyes Rush Delivery",
};

export default async function RoleChangesPage() {
  const logs = await getRoleChangeLogs();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Role changes" description="History of every admin and user role change." />
      <AuditLogTable logs={logs} showFilters={false} />
    </div>
  );
}
