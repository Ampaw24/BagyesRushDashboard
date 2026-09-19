import type { RiderAgreementDto } from "../types/api";
import { toDate, toDateOrEpoch } from "./dates";

export type RiderAgreementRow = {
  id: number;
  version: string;
  title: string;
  summary: string | null;
  body: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  isActive: boolean;
  publishedAt: Date | null;
  ridersCount: number | null;
  authorEmail: string | null;
  createdAt: Date;
};

export function toRiderAgreementRow(dto: RiderAgreementDto): RiderAgreementRow {
  return {
    id: dto.id,
    version: dto.version,
    title: dto.title,
    summary: dto.summary,
    body: dto.body,
    fileUrl: dto.file_url,
    fileName: dto.file_name,
    fileSize: dto.file_size,
    isActive: dto.is_active,
    publishedAt: toDate(dto.published_at),
    ridersCount: dto.riders_count ?? null,
    authorEmail: dto.author?.email ?? null,
    createdAt: toDateOrEpoch(dto.created_at),
  };
}
