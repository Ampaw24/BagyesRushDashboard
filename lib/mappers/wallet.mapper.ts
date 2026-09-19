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
  /**
   * What can actually be cashed out, and what is stuck on the platform.
   *
   * Equal to `balance` and zero respectively for a rider or a vendor, so the
   * UI can read them unconditionally. They only separate on a customer wallet.
   */
  withdrawable: number;
  spendableOnly: number;
  withdrawalsEnabled: boolean;
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
    // Falling back to the whole balance rather than zero: against a backend
    // that does not send these, every balance is withdrawable, which is what
    // was true before the split existed.
    withdrawable: dto.withdrawable ?? dto.balance,
    spendableOnly: dto.spendable_only ?? 0,
    withdrawalsEnabled: dto.withdrawals_enabled ?? true,
  };
}

export type WalletTransactionRow = {
  id: number;
  reference: string;
  type: WalletTransactionType;
  typeLabel: string;
  isCredit: boolean;
  /**
   * A vendor's earning is reserved when the customer pays and released on
   * delivery, so a row can be on the statement before it is spendable.
   * Defaults to "available" against a backend that predates this.
   */
  status: "pending" | "available" | "void";
  statusLabel: string | null;
  isPending: boolean;
  /** Signed: negative when money went out. */
  amount: number;
  balanceAfter: number;
  currency: string;
  note: string | null;
  orderNumber: string | null;
  orderId: number | null;
  withdrawalId: number | null;
  /** Only set on the platform-wide ledger; null on a single party's statement. */
  ownerType: "rider" | "vendor" | "customer" | null;
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
    status: dto.status ?? "available",
    statusLabel: dto.status_label ?? null,
    isPending: dto.is_pending ?? false,
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
  ownerType: "rider" | "vendor" | "customer" | null;
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
