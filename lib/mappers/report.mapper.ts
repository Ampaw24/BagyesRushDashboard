import type { ReportDto } from "../types/api";
import type { ReportStatus, ReportTargetType } from "../types/enums";
import { toDate, toDateOrEpoch } from "./dates";

export type ReportRow = {
  id: number;
  uuid: string;
  reporterRole: string;
  reporterName: string;
  reporterPhone: string | null;
  reporterEmail: string | null;
  targetType: ReportTargetType;
  targetTypeLabel: string;
  targetId: number | null;
  targetName: string;
  targetPhone: string | null;
  targetImageUrl: string | null;
  orderId: number | null;
  orderNumber: string | null;
  reasonCode: string;
  reasonLabel: string;
  description: string;
  /**
   * Short-lived signed URLs. They expire, so a page holding one for a long time
   * will start showing broken images — reload rather than caching them.
   */
  attachments: string[];
  status: ReportStatus;
  statusLabel: string;
  isOpen: boolean;
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
};

export function toReportRow(dto: ReportDto): ReportRow {
  return {
    id: dto.id,
    uuid: dto.uuid,
    reporterRole: dto.reporter_role,
    reporterName: dto.reporter?.name ?? "Deleted account",
    reporterPhone: dto.reporter?.phone ?? null,
    reporterEmail: dto.reporter?.email ?? null,
    targetType: dto.target_type,
    targetTypeLabel: dto.target_type_label,
    targetId: dto.target_id,
    targetName: dto.target_name,
    targetPhone: dto.target_phone,
    targetImageUrl: dto.target_image_url,
    orderId: dto.order_id,
    orderNumber: dto.order_number,
    reasonCode: dto.reason_code,
    reasonLabel: dto.reason_label,
    description: dto.description,
    attachments: dto.attachments ?? [],
    status: dto.status,
    statusLabel: dto.status_label,
    isOpen: dto.is_open,
    resolutionNote: dto.resolution_note,
    resolvedBy: dto.resolved_by,
    resolvedAt: toDate(dto.resolved_at),
    createdAt: toDateOrEpoch(dto.created_at),
  };
}
