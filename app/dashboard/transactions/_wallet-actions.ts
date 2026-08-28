"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import { adjustRiderWallet, processWithdrawal } from "@/lib/services/wallets.service";
import type { WalletTransactionType } from "@/lib/types/enums";

/**
 * Rider payouts and wallet adjustments.
 *
 * Nothing here moves money on its own: `mark_paid` records that somebody sent
 * it. The backend permissions are the real gate — `withdrawals.process` for the
 * queue, `riders.wallet` for adjustments — and these wrappers only carry the
 * session cookie and normalise the result for the dialogs.
 */
function revalidateWalletViews(riderId?: number) {
  revalidatePath("/dashboard/transactions/payout-requests");
  revalidatePath("/dashboard/transactions/payouts");
  revalidatePath("/dashboard/transactions/earnings");
  if (riderId !== undefined) revalidatePath(`/dashboard/riders/${riderId}`);
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

export async function adjustWalletAction(
  riderId: number,
  direction: "credit" | "debit",
  input: { amount: number; note: string; type?: WalletTransactionType },
) {
  return apiAction(direction === "credit" ? "Wallet credited" : "Wallet debited", async () => {
    await adjustRiderWallet(riderId, direction, input);
    revalidateWalletViews(riderId);
  });
}
