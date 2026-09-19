import type { ReferralDto, ReferralMilestoneDto } from "../types/api";
import { toDate, toDateOrEpoch } from "./dates";

export type ReferralRow = {
  id: number;
  code: string;
  status: "pending" | "qualified" | "cancelled";
  statusLabel: string;
  referrerName: string;
  referrerId: number | null;
  refereeName: string;
  orderNumber: string | null;
  reward: number | null;
  refereeBonus: number | null;
  joinedAt: Date;
  qualifiedAt: Date | null;
};

export function toReferralRow(dto: ReferralDto): ReferralRow {
  return {
    id: dto.id,
    code: dto.code,
    status: dto.status,
    statusLabel: dto.status_label,
    referrerName: dto.referrer?.name ?? "Deleted customer",
    referrerId: dto.referrer?.id ?? null,
    refereeName: dto.referee?.name ?? "Deleted customer",
    orderNumber: dto.qualifying_order?.order_number ?? null,
    reward: dto.reward,
    refereeBonus: dto.referee_bonus,
    joinedAt: toDateOrEpoch(dto.joined_at),
    qualifiedAt: toDate(dto.qualified_at),
  };
}

export type ReferralMilestoneRow = {
  id: number;
  referralsRequired: number;
  reward: number;
  description: string | null;
  isActive: boolean;
  awardsCount: number;
};

export function toReferralMilestoneRow(dto: ReferralMilestoneDto): ReferralMilestoneRow {
  return {
    id: dto.id,
    referralsRequired: dto.referrals_required,
    reward: dto.reward,
    description: dto.description,
    isActive: dto.is_active,
    awardsCount: dto.awards_count ?? 0,
  };
}
