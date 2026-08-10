import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminDetail } from "./_components/admin-detail";
import { getAdminUserById } from "../../../_services/mock-data";
import { CURRENT_ADMIN_ID, getAuditLogs, getPermissions, getRoles, getSuperAdminCount } from "../../../_services/administration-mock-data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const admin = await getAdminUserById(id);
  return { title: admin ? `${admin.name} — Bagyes Rush Delivery` : "Administrator — Bagyes Rush Delivery" };
}

export default async function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAdminUserById(id);
  if (!admin) notFound();

  const [currentAdmin, roles, permissions, superAdminCount, auditLogs] = await Promise.all([
    getAdminUserById(CURRENT_ADMIN_ID),
    getRoles(),
    getPermissions(),
    getSuperAdminCount(),
    getAuditLogs(),
  ]);

  const activity = auditLogs.filter((log) => log.targetType === "admin" && log.targetId === admin.id);

  return (
    <AdminDetail
      admin={admin}
      actorRole={currentAdmin?.role ?? "support_staff"}
      isSelf={admin.id === CURRENT_ADMIN_ID}
      roles={roles}
      permissions={permissions}
      activeSuperAdminCount={superAdminCount}
      activity={activity}
    />
  );
}
