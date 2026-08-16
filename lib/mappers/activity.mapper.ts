import { humaniseAction } from "../types/activity-actions";
import type { ActivityDto } from "../types/api";
import { toDateOrEpoch } from "./dates";

export type ActivityRow = {
  id: number;
  action: string;
  actionLabel: string;
  description: string;
  adminId: number | null;
  adminEmail: string;
  adminRole: string | null;
  subjectType: string | null;
  subjectId: number | null;
  /** Already redacted server-side — secrets arrive as "[redacted]". */
  properties: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
};

export function toActivityRow(dto: ActivityDto): ActivityRow {
  return {
    id: dto.id,
    action: dto.action,
    actionLabel: humaniseAction(dto.action),
    description: dto.description,
    adminId: dto.admin.id,
    // A deleted admin leaves the id and email null but the entry stands.
    adminEmail: dto.admin.email ?? "System",
    adminRole: dto.admin.role,
    subjectType: dto.subject?.type ?? null,
    subjectId: dto.subject?.id ?? null,
    properties: dto.properties,
    ipAddress: dto.ip_address,
    createdAt: toDateOrEpoch(dto.created_at),
  };
}
