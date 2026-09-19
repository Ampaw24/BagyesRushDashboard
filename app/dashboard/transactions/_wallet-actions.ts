"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  adjustWallet,
  processWithdrawal,
  verifyWithdrawal,
  type WalletParty,
} from "@/lib/services/wallets.service";
import type { WalletTransactionType } from "@/lib/types/enums";

/**
 * Rider payouts and wallet adjustments.
 *
 * Nothing here moves money on its own: `mark_paid` records that somebody sent
 * it. The backend permissions are the real gate — `withdrawals.process` for the
 * queue, `riders.wallet` for adjustments — and these wrappers only carry the
 * session cookie and normalise the result for the dialogs.
 */
function revalidateWalletViews(party?: WalletParty, id?: number) {
  revalidatePath("/dashboard/transactions/payout-requests");
  revalidatePath("/dashboard/transactions/payouts");
  revalidatePath("/dashboard/transactions/earnings");
  revalidatePath("/dashboard/transactions/all");
  if (party && id !== undefined) revalidatePath(`/dashboard/${party}s/${id}`);
}

export async function approveWithdrawalAction(id: number) {
  return apiAction("Withdrawal approved", async () => {
    await processWithdrawal(id, "approve");
    revalidateWalletViews();
  });
}

/** `reason` must be 5–255 characters — the rider is shown it. */
export async function rejectWithdrawalAction(id: number, reason: string) {
  return apiAction("Withdrawal rejected — the money is back in the rider's wallet", async () => {
    await processWithdrawal(id, "reject", { reason });
    revalidateWalletViews();
  });
}

/** Records that a human sent the money. It does not send it. */
export async function markWithdrawalPaidAction(id: number, paymentReference?: string) {
  return apiAction("Withdrawal marked as paid", async () => {
    await processWithdrawal(id, "mark_paid", { payment_reference: paymentReference });
    revalidateWalletViews();
  });
}

/**
 * Ask the provider what became of a payout it already accepted.
 *
 * For the withdrawal that is stuck in `approved` because its `transfer.success`
 * webhook never arrived: the owner's balance is reserved, and without this
 * nobody could say whether the money actually left. The backend routes the
 * answer through the same settlement path the webhook uses, so this cannot
 * produce a second opinion about whether somebody has been paid.
 *
 * The toast carries the API's own wording, because "the provider has never
 * heard of this reference" and "the transfer succeeded" are different
 * situations and only the backend knows which one it got.
 */
export async function verifyWithdrawalAction(id: number) {
  return apiAction("Checked with the provider", async () => {
    const result = await verifyWithdrawal(id);
    revalidateWalletViews();

    return result;
  });
}

/**
 * Post a line to a rider's or a vendor's statement.
 *
 * The party decides the endpoint and therefore the permission — `riders.wallet`
 * or `vendors.wallet`. The backend is the real gate; this only carries the
 * session cookie.
 */
export async function adjustWalletAction(
  party: WalletParty,
  id: number,
  direction: "credit" | "debit",
  input: { amount: number; note: string; type?: WalletTransactionType },
) {
  return apiAction(direction === "credit" ? "Wallet credited" : "Wallet debited", async () => {
    await adjustWallet(party, id, direction, input);
    revalidateWalletViews(party, id);
  });
}
