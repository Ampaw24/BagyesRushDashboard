import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { AuditLogTable } from "../_components/audit-log-table";
import { getAuditLogs } from "../../_services/administration-mock-data";

export const metadata: Metadata = {
  title: "Audit Logs — Bagyes Rush Delivery",
};

export default async function AuditLogsPage() {
  const logs = await getAuditLogs();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Audit logs" description="Every sensitive administrative action, in one trail." />
      <AuditLogTable logs={logs} />
    </div>
  );
}
