import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type {
  RiderWalletSummaryDto,
  WalletTransactionDto,
  WithdrawalDto,
  WithdrawalStatsDto,
} from "../types/api";
import type { WalletTransactionType, WithdrawalStatus } from "../types/enums";

export type WithdrawalListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: WithdrawalStatus;
  /** One queue carries both sides; omit for all of it. */
  owner_type?: "rider" | "vendor";
  owner_id?: number;
  from?: string;
  to?: string;
};

/**
 * GET /admin/withdrawals — requires `withdrawals.view`.
 *
 * Requests awaiting a decision come first, then oldest by request date:
 * somebody has been waiting longest for their money.
 */
export async function listWithdrawals(query: WithdrawalListQuery): Promise<Paginated<WithdrawalDto>> {
  return apiFetchPage<WithdrawalDto>("/admin/withdrawals", { query });
}

export async function getWithdrawalStats(): Promise<WithdrawalStatsDto> {
  return apiFetch<WithdrawalStatsDto>("/admin/withdrawals/stats");
}

export async function getWithdrawal(id: number): Promise<WithdrawalDto> {
  return apiFetch<WithdrawalDto>(`/admin/withdrawals/${id}`);
}

/**
 * PATCH /admin/withdrawals/{id}/process — requires `withdrawals.process`.
 *
 * Nothing here disburses. `mark_paid` records that a human sent the money —
 * the platform holds no transfer API, and a button claiming otherwise would be
 * worse than one that records what was done. `reason` is required to reject.
 */
export async function processWithdrawal(
  id: number,
  action: "approve" | "reject" | "mark_paid",
  options: { reason?: string; payment_reference?: string } = {},
): Promise<WithdrawalDto> {
  return apiFetch<WithdrawalDto>(`/admin/withdrawals/${id}/process`, {
    method: "PATCH",
    body: { action, ...options },
  });
}

/** GET /admin/riders/{id}/wallet — requires `riders.wallet`. */
export async function getRiderWallet(riderId: number): Promise<{
  summary: RiderWalletSummaryDto;
  rider: { id: number; name: string; rider_code: string };
}> {
  return apiFetch(`/admin/riders/${riderId}/wallet`);
}

export type WalletTransactionQuery = {
  page?: number;
  per_page?: number;
  type?: WalletTransactionType;
  from?: string;
  to?: string;
};

export async function listRiderTransactions(
  riderId: number,
  query: WalletTransactionQuery = {},
): Promise<Paginated<WalletTransactionDto>> {
  return apiFetchPage<WalletTransactionDto>(`/admin/riders/${riderId}/wallet/transactions`, { query });
}

/**
 * Move money into or out of a rider's wallet. Requires `riders.wallet`, which
 * is separate from `withdrawals.process` on purpose — putting money in and
 * deciding whether a payout goes out are different jobs.
 *
 * `note` is required and must be at least 5 characters: a movement with no
 * explanation is indistinguishable from a mistake six months later.
 */
export async function adjustRiderWallet(
  riderId: number,
  direction: "credit" | "debit",
  input: { amount: number; note: string; type?: WalletTransactionType },
): Promise<{ transaction: WalletTransactionDto; summary: RiderWalletSummaryDto }> {
  return apiFetch(`/admin/riders/${riderId}/wallet/${direction}`, {
    method: "POST",
    body: input,
  });
}
