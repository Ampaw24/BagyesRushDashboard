import { getAdminUsers, type AdminRole } from "./mock-data";
import { getAllVendorStatusEvents, type VendorStatusEvent } from "./vendors-mock-data";

export type PermissionKey =
  | "vendor.view"
  | "vendor.create"
  | "vendor.edit"
  | "vendor.suspend"
  | "vendor.delete"
  | "user.view"
  | "user.edit"
  | "user.role.change"
  | "admin.view"
  | "admin.create"
  | "admin.edit"
  | "admin.remove"
  | "communication.view"
  | "communication.create"
  | "communication.send"
  | "analytics.view"
  | "audit.view";

export type PermissionResource = "vendor" | "user" | "admin" | "communication" | "analytics" | "audit";

export type Permission = { key: PermissionKey; label: string; description: string; resource: PermissionResource };

export type RoleDefinition = {
  role: AdminRole;
  label: string;
  description: string;
  systemRole: boolean;
  permissions: PermissionKey[];
};

export type AuditAction =
  | "ADMIN_CREATED"
  | "ADMIN_ROLE_CHANGED"
  | "ADMIN_SUSPENDED"
  | "ADMIN_REACTIVATED"
  | "ADMIN_REMOVED"
  | "USER_ROLE_CHANGED"
  | "VENDOR_CREATED"
  | "VENDOR_UPDATED"
  | "VENDOR_SUSPENDED"
  | "VENDOR_ACTIVATED"
  | "VENDOR_ARCHIVED"
  | "VENDOR_VERIFIED"
  | "VENDOR_REJECTED";

export type AuditTargetType = "admin" | "user" | "vendor";

export type AuditLogEntry = {
  id: string;
  action: AuditAction;
  actor: string;
  targetType: AuditTargetType;
  targetId: string;
  targetLabel: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  createdAt: Date;
};

const NOW = new Date("2026-08-07T17:30:00");

// The seeded admin who the UI treats as "you" — purely so self-protection
// rules (e.g. "can't remove your own Super Admin access") have a concrete
// actor to check against. There's no real session in this mock app.
export const CURRENT_ADMIN_ID = "AD-100";

const PERMISSIONS: Permission[] = [
  { key: "vendor.view", label: "View vendors", description: "See vendor profiles and status.", resource: "vendor" },
  { key: "vendor.create", label: "Create vendors", description: "Onboard new vendors.", resource: "vendor" },
  { key: "vendor.edit", label: "Edit vendors", description: "Update vendor profile information.", resource: "vendor" },
  { key: "vendor.suspend", label: "Suspend / verify vendors", description: "Suspend, activate, verify, or reject vendors.", resource: "vendor" },
  { key: "vendor.delete", label: "Archive vendors", description: "Archive a vendor's account.", resource: "vendor" },
  { key: "user.view", label: "View users", description: "See customer and rider profiles.", resource: "user" },
  { key: "user.edit", label: "Edit users", description: "Update user account information.", resource: "user" },
  { key: "user.role.change", label: "Change user roles", description: "Promote or change a user's platform role.", resource: "user" },
  { key: "admin.view", label: "View administrators", description: "See the list of dashboard administrators.", resource: "admin" },
  { key: "admin.create", label: "Create administrators", description: "Add new administrator accounts.", resource: "admin" },
  { key: "admin.edit", label: "Edit administrators", description: "Suspend, reactivate, or edit administrators.", resource: "admin" },
  { key: "admin.remove", label: "Remove admin access", description: "Revoke an administrator's dashboard access.", resource: "admin" },
  { key: "communication.view", label: "View communications", description: "See communication history and analytics.", resource: "communication" },
  { key: "communication.create", label: "Create communications", description: "Draft communications and announcements.", resource: "communication" },
  { key: "communication.send", label: "Send communications", description: "Send or schedule communications to users.", resource: "communication" },
  { key: "analytics.view", label: "View analytics", description: "Access platform-wide analytics and dashboards.", resource: "analytics" },
  { key: "audit.view", label: "View audit logs", description: "Access the administrative audit trail.", resource: "audit" },
];

const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

const ROLES: RoleDefinition[] = [
  {
    role: "super_admin",
    label: "Super Admin",
    description: "Full access to every module, including administrator and role management.",
    systemRole: true,
    permissions: ALL_PERMISSION_KEYS,
  },
  {
    role: "admin",
    label: "Admin",
    description: "Manages vendors, users, and communications. Cannot manage other administrators.",
    systemRole: false,
    permissions: [
      "vendor.view",
      "vendor.create",
      "vendor.edit",
      "vendor.suspend",
      "user.view",
      "user.edit",
      "communication.view",
      "communication.create",
      "communication.send",
      "analytics.view",
    ],
  },
  {
    role: "support_staff",
    label: "Support Staff",
    description: "Read-only access for handling day-to-day support queries.",
    systemRole: false,
    permissions: ["vendor.view", "user.view", "communication.view", "analytics.view"],
  },
];

function mapVendorEventToAction(event: VendorStatusEvent): AuditAction {
  if (event.previousStatus === null) return "VENDOR_CREATED";
  if (event.reason === "Approved after document review.") return "VENDOR_VERIFIED";
  if (event.newStatus === "suspended") return "VENDOR_SUSPENDED";
  if (event.newStatus === "archived") return "VENDOR_ARCHIVED";
  if (event.newStatus === "active") return "VENDOR_ACTIVATED";
  return "VENDOR_UPDATED";
}

const ADMIN_AUDIT_SEEDS: Omit<AuditLogEntry, "id">[] = [
  {
    action: "ADMIN_CREATED",
    actor: "Chioma Nwadike",
    targetType: "admin",
    targetId: "AD-104",
    targetLabel: "Patience Okoli",
    newValue: "support_staff",
    createdAt: new Date(NOW.getTime() - 45 * 24 * 60 * 60 * 1000),
  },
  {
    action: "ADMIN_ROLE_CHANGED",
    actor: "Chioma Nwadike",
    targetType: "admin",
    targetId: "AD-102",
    targetLabel: "Funmilayo Ade",
    previousValue: "support_staff",
    newValue: "admin",
    reason: "Promoted after onboarding review period.",
    createdAt: new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    action: "USER_ROLE_CHANGED",
    actor: "Chioma Nwadike",
    targetType: "user",
    targetId: "CU-808",
    targetLabel: "Ifeoma Uche",
    previousValue: "customer",
    newValue: "admin",
    reason: "Promoted to support the vendor operations team.",
    createdAt: new Date(NOW.getTime() - 22 * 24 * 60 * 60 * 1000),
  },
  {
    action: "ADMIN_SUSPENDED",
    actor: "Chioma Nwadike",
    targetType: "admin",
    targetId: "AD-103",
    targetLabel: "Tochukwu Igwe",
    reason: "Extended leave of absence.",
    createdAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    action: "ADMIN_REACTIVATED",
    actor: "Chioma Nwadike",
    targetType: "admin",
    targetId: "AD-103",
    targetLabel: "Tochukwu Igwe",
    createdAt: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000),
  },
];

let auditLogCache: AuditLogEntry[] | null = null;

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  if (auditLogCache) return auditLogCache;

  const vendorEvents = await getAllVendorStatusEvents();
  const vendorEntries: AuditLogEntry[] = vendorEvents.map((event, i) => ({
    id: `AL-${(1 + i).toString()}`,
    action: mapVendorEventToAction(event),
    actor: event.changedBy,
    targetType: "vendor",
    targetId: event.vendorId,
    targetLabel: event.vendorId,
    previousValue: event.previousStatus ?? undefined,
    newValue: event.newStatus,
    reason: event.reason,
    createdAt: event.createdAt,
  }));

  const adminEntries: AuditLogEntry[] = ADMIN_AUDIT_SEEDS.map((seed, i) => ({
    id: `AL-A${(1 + i).toString()}`,
    ...seed,
  }));

  auditLogCache = [...vendorEntries, ...adminEntries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return auditLogCache;
}

export async function getRoleChangeLogs(): Promise<AuditLogEntry[]> {
  const logs = await getAuditLogs();
  return logs.filter((l) => l.action === "ADMIN_ROLE_CHANGED" || l.action === "USER_ROLE_CHANGED");
}

export async function getRoles(): Promise<RoleDefinition[]> {
  return ROLES;
}

export async function getPermissions(): Promise<Permission[]> {
  return PERMISSIONS;
}

export async function getSuperAdminCount(): Promise<number> {
  const admins = await getAdminUsers();
  return admins.filter((a) => a.role === "super_admin" && a.status === "active").length;
}
