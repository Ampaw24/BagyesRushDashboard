import type { RiderWalletSummaryDto, WalletTransactionDto, WithdrawalDto } from "../types/api";
import type { WalletTransactionType, WithdrawalStatus } from "../types/enums";
import { toDate, toDateOrEpoch } from "./dates";

export type WalletSummary = {
  balance: number;
  currency: string;
  lifetimeEarned: number;
  lifetimeWithdrawn: number;
  /** Already reserved out of `balance`, but worth naming on screen. */
  pendingWithdrawal: number;
  minimumWithdrawal: number;
  canWithdraw: boolean;
  hasPayoutDetails: boolean;
};

export function toWalletSummary(dto: RiderWalletSummaryDto): WalletSummary {
  return {
    balance: dto.balance,
    currency: dto.currency,
    lifetimeEarned: dto.lifetime_earned,
    lifetimeWithdrawn: dto.lifetime_withdrawn,
    pendingWithdrawal: dto.pending_withdrawal,
    minimumWithdrawal: dto.minimum_withdrawal,
    canWithdraw: dto.can_withdraw,
    hasPayoutDetails: dto.has_payout_details,
  };
}

export type WalletTransactionRow = {
  id: number;
  reference: string;
  type: WalletTransactionType;
  typeLabel: string;
  isCredit: boolean;
  /** Signed: negative when money went out. */
  amount: number;
  balanceAfter: number;
  currency: string;
  note: string | null;
  orderNumber: string | null;
  orderId: number | null;
  withdrawalId: number | null;
  /** Only set on the platform-wide ledger; null on a single party's statement. */
  ownerType: "rider" | "vendor" | null;
  ownerId: number | null;
  ownerName: string | null;
  createdAt: Date;
};

export function toWalletTransactionRow(dto: WalletTransactionDto): WalletTransactionRow {
  return {
    id: dto.id,
    reference: dto.reference,
    type: dto.type,
    typeLabel: dto.type_label,
    isCredit: dto.is_credit,
    amount: dto.amount,
    balanceAfter: dto.balance_after,
    currency: dto.currency,
    note: dto.note,
    orderNumber: dto.order?.order_number ?? null,
    orderId: dto.order?.id ?? null,
    withdrawalId: dto.withdrawal_id,
    ownerType: dto.owner_type ?? null,
    ownerId: dto.owner?.id ?? null,
    ownerName: dto.owner?.name ?? null,
    createdAt: toDateOrEpoch(dto.created_at),
  };
}

export type WithdrawalRow = {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  statusLabel: string;
  isOpen: boolean;
  destinationType: "bank" | "mobile_money";
  destinationProvider: string | null;
  destinationName: string | null;
  /** Last four digits only — the full number is never returned. */
  destinationLast4: string | null;
  /** "rider" or "vendor" — one queue carries both. */
  ownerType: "rider" | "vendor" | null;
  ownerId: number | null;
  ownerName: string | null;
  ownerPhone: string | null;
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  paidAt: Date | null;
  paymentReference: string | null;
  rejectionReason: string | null;
};

export function toWithdrawalRow(dto: WithdrawalDto): WithdrawalRow {
  return {
    id: dto.id,
    reference: dto.reference,
    amount: dto.amount,
    currency: dto.currency,
    status: dto.status,
    statusLabel: dto.status_label,
    isOpen: dto.is_open,
    destinationType: dto.destination.type,
    destinationProvider: dto.destination.provider ?? null,
    destinationName: dto.destination.account_name,
    destinationLast4: dto.destination.last4,
    ownerType: dto.owner_type ?? null,
    ownerId: dto.owner?.id ?? null,
    ownerName: dto.owner?.name ?? null,
    ownerPhone: dto.owner?.phone ?? null,
    requestedAt: toDateOrEpoch(dto.requested_at),
    reviewedAt: toDate(dto.reviewed_at),
    reviewedBy: dto.reviewed_by ?? null,
    paidAt: toDate(dto.paid_at),
    paymentReference: dto.payment_reference,
    rejectionReason: dto.rejection_reason,
  };
}
