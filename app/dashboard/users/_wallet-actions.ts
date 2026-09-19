"use server";

import { apiAction } from "@/lib/api/action";
import { toWalletSummary, toWalletTransactionRow } from "@/lib/mappers/wallet.mapper";
import { getWallet, listWalletTransactions } from "@/lib/services/wallets.service";

/**
 * A customer's credit, loaded when the wallet tab is opened.
 *
 * On demand rather than with the row, for the same reason the order summary is:
 * the customers list does not carry any of it, and most rows are never opened.
 *
 * The whole thing is behind `customers.wallet`, which a support agent does not
 * hold — so a failure here is expected for some roles and is surfaced as a
 * message rather than an error. Reading somebody's balance and being able to
 * add to it are the same permission because the screen offers both.
 */
export async function loadCustomerWalletAction(customerId: number) {
  return apiAction("Wallet retrieved", async () => {
    const [wallet, transactions] = await Promise.all([
      getWallet("customer", customerId),
      listWalletTransactions("customer", customerId, { per_page: 25 }),
    ]);

    return {
      summary: toWalletSummary(wallet.summary),
      payoutMethod: wallet.payout_method ?? null,
      transactions: transactions.items.map(toWalletTransactionRow),
    };
  });
}
