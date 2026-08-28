import { apiFetchOptional, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type {
  AdminOrderDto,
  FinanceSummaryDto,
  WalletBalanceDto,
  WalletTransactionDto,
} from "../types/api";

export type LedgerQuery = {
  page?: number;
  per_page?: number;
  owner_type?: "rider" | "vendor";
  owner_id?: number;
  type?: string;
  from?: string;
  to?: string;
  search?: string;
};

/**
 * Where the money went. All behind `payments.view` — reading, not moving.
 *
 * Every figure is what was recorded at the time rather than re-derived from
 * today's rates: a commission report that recalculated itself would quietly
 * restate last month whenever somebody changed a percentage.
 */
export async function getFinanceSummary(
  query: { from?: string; to?: string } = {},
): Promise<FinanceSummaryDto | null> {
  return apiFetchOptional<FinanceSummaryDto>("/admin/finance/summary", { query });
}

/** The platform-wide ledger. `owner_type` narrows it to one side. */
export async function listLedger(query: LedgerQuery): Promise<Paginated<WalletTransactionDto>> {
  return apiFetchPage<WalletTransactionDto>("/admin/finance/ledger", { query });
}

/** Who is owed what, biggest balance first — the shape of a payout run. */
export async function listBalances(
  ownerType: "rider" | "vendor",
  query: { page?: number; per_page?: number } = {},
): Promise<Paginated<WalletBalanceDto>> {
  return apiFetchPage<WalletBalanceDto>(`/admin/finance/balances/${ownerType}`, { query });
}

/** Commission earned, order by order. */
export async function listCommissions(
  query: { page?: number; per_page?: number; from?: string; to?: string; vendor_id?: number } = {},
): Promise<Paginated<AdminOrderDto>> {
  return apiFetchPage<AdminOrderDto>("/admin/finance/commissions", { query });
}

/**
 * Money taken for orders that will not be delivered.
 *
 * Nothing refunds automatically, so this is a work queue rather than an
 * archive.
 */
export async function listRefunds(
  query: { page?: number; per_page?: number; from?: string; to?: string; search?: string } = {},
): Promise<Paginated<AdminOrderDto>> {
  return apiFetchPage<AdminOrderDto>("/admin/finance/refunds", { query });
}
