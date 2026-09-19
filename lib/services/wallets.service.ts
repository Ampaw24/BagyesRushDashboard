import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type {
  CustomerPayoutMethodDto,
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
  /** One queue carries every side; omit for all of it. */
  owner_type?: "rider" | "vendor" | "customer";
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

/**
 * POST /admin/withdrawals/{id}/verify — requires `withdrawals.process`.
 *
 * Asks the provider what became of a payout it already accepted. Settlement
 * normally arrives by webhook; when one never lands, the withdrawal sits in
 * `approved` with the owner's balance reserved and nobody able to say whether
 * the money moved. Before this the only recourse was the Paystack dashboard.
 *
 * The answer routes through the same settlement path the webhook uses, so a
 * verified payout and a webhooked one cannot disagree about whether somebody
 * has been paid. `changed` is false when the provider had nothing new to say.
 */
export async function verifyWithdrawal(id: number): Promise<{
  withdrawal: WithdrawalDto;
  provider_status: string | null;
  changed: boolean;
}> {
  return apiFetch(`/admin/withdrawals/${id}/verify`, { method: "POST" });
}

/**
 * Whose wallet this is.
 *
 * All three have the same wallet, the same statement and the same adjustment
 * rules — the backend routes are identical bar the segment — so the calls below
 * take the party rather than existing three times.
 *
 * What differs is what the balance *means*. A rider's and a vendor's is money
 * they earned and all of it can be paid out. A customer's is refunds and
 * goodwill, so part of it may be spendable on the platform and nowhere else,
 * and cashing out is off unless an admin has turned it on.
 */
export type WalletParty = "rider" | "vendor" | "customer";

/** `/admin/riders/...`, `/admin/vendors/...` or `/admin/customers/...` */
const walletBase = (party: WalletParty, id: number) => `/admin/${party}s/${id}/wallet`;

/**
 * GET /admin/{party}s/{id}/wallet — requires `riders.wallet` or
 * `vendors.wallet` respectively.
 *
 * The owner block is keyed by party: a rider payload carries `rider`, a vendor
 * one carries `vendor`.
 */
export async function getWallet(
  party: WalletParty,
  id: number,
): Promise<{
  summary: RiderWalletSummaryDto;
  rider?: { id: number; name: string; rider_code: string };
  vendor?: { id: number; name: string; vendor_id: string };
  customer?: { id: number; name: string; phone: string | null };
  payout_method?: CustomerPayoutMethodDto;
}> {
  return apiFetch(walletBase(party, id));
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

export async function listWalletTransactions(
  party: WalletParty,
  id: number,
  query: WalletTransactionQuery = {},
): Promise<Paginated<WalletTransactionDto>> {
  return apiFetchPage<WalletTransactionDto>(`${walletBase(party, id)}/transactions`, { query });
}

export async function listRiderTransactions(
  riderId: number,
  query: WalletTransactionQuery = {},
): Promise<Paginated<WalletTransactionDto>> {
  return listWalletTransactions("rider", riderId, query);
}

/**
 * Move money into or out of a rider's wallet. Requires `riders.wallet`, which
 * is separate from `withdrawals.process` on purpose — putting money in and
 * deciding whether a payout goes out are different jobs.
 *
 * `note` is required and must be at least 5 characters: a movement with no
 * explanation is indistinguishable from a mistake six months later.
 */
export async function adjustWallet(
  party: WalletParty,
  id: number,
  direction: "credit" | "debit",
  input: { amount: number; note: string; type?: WalletTransactionType },
): Promise<{ transaction: WalletTransactionDto; summary: RiderWalletSummaryDto }> {
  return apiFetch(`${walletBase(party, id)}/${direction}`, {
    method: "POST",
    body: input,
  });
}

export async function adjustRiderWallet(
  riderId: number,
  direction: "credit" | "debit",
  input: { amount: number; note: string; type?: WalletTransactionType },
): Promise<{ transaction: WalletTransactionDto; summary: RiderWalletSummaryDto }> {
  return adjustWallet("rider", riderId, direction, input);
}
