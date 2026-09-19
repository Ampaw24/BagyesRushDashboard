"use client";

import { useState } from "react";

import { TableCell, TableHeadCell, TableShell } from "./table-shell";
import { EmptyState } from "./empty-state";
import { useToast } from "./toast-provider";
import { formatCurrency, formatDateTime } from "../_lib/format";
import { adjustWalletAction } from "../transactions/_wallet-actions";
import type { WalletParty } from "@/lib/services/wallets.service";
import type { WalletSummary, WalletTransactionRow } from "@/lib/mappers/wallet.mapper";

/**
 * A rider's, a vendor's or a customer's money, from the staff side.
 *
 * One component for all three, because a wallet is a wallet: the same balance,
 * the same statement, the same adjustment rules, and backend routes that differ
 * only by the segment. What changes is the wording and which permission gates
 * it, so all of it is derived from `party` rather than duplicated.
 *
 * A customer's wallet is the one that reads differently, and the figures say
 * why. A rider and a vendor earn their balance and every cedi of it can be paid
 * out. A customer's arrives as refunds and goodwill, and only the refunds can
 * ever be cashed out — so `withdrawable` and `spendableOnly` are shown as two
 * numbers rather than one, and staff can see at a glance which half of somebody
 * asking to withdraw is actually theirs to take.
 *
 * The statement is the record; the balance at the top is a cached total the
 * backend keeps in step with it. Every adjustment posted here appends a row
 * rather than editing one, which is what leaves a trail somebody can follow
 * afterwards.
 */
export function WalletTab({
  party,
  ownerId,
  ownerName,
  summary,
  transactions,
  canAdjust,
}: {
  party: WalletParty;
  ownerId: number;
  ownerName: string;
  /** Null when the admin lacks `riders.wallet` / `vendors.wallet`. */
  summary: WalletSummary | null;
  transactions: WalletTransactionRow[];
  canAdjust: boolean;
}) {
  const isCustomer = party === "customer";

  if (!summary) {
    return (
      <EmptyState
        title="Wallet is not visible to your role"
        description={`Seeing or moving a ${party}'s money needs the ${party}s.wallet permission, which is separate from managing them.`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Figure label="Balance" value={formatCurrency(summary.balance)} emphasis />
        {isCustomer ? (
          <>
            <Figure label="Can be cashed out" value={formatCurrency(summary.withdrawable)} />
            <Figure label="Spendable here only" value={formatCurrency(summary.spendableOnly)} />
          </>
        ) : (
          <>
            <Figure label="Reserved for payout" value={formatCurrency(summary.pendingWithdrawal)} />
            <Figure label="Earned all time" value={formatCurrency(summary.lifetimeEarned)} />
          </>
        )}
        <Figure label="Withdrawn all time" value={formatCurrency(summary.lifetimeWithdrawn)} />
      </div>

      {isCustomer && summary.spendableOnly > 0 && (
        <p className="break-words rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-secondary">
          <span className="font-medium text-foreground">
            {formatCurrency(summary.spendableOnly)} of this balance cannot be withdrawn.{" "}
          </span>
          Goodwill and promotional credit can be spent on orders and nowhere else. Only credit that
          came from a refunded payment is real money the platform received.
        </p>
      )}

      {isCustomer && !summary.withdrawalsEnabled && (
        <p className="break-words rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-secondary">
          <span className="font-medium text-foreground">Customer cash-out is switched off. </span>
          This balance can be spent at checkout but not withdrawn. Turn it on under System Config
          &rsaquo; Money if you want to start reviewing customer payout requests.
        </p>
      )}

      {!summary.hasPayoutDetails && !isCustomer && (
        <p className="break-words rounded-xl border border-status-warning/30 bg-status-warning/5 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">No payout destination. </span>
          <span className="text-text-secondary">
            {ownerName} cannot be paid until they add a bank account or mobile money number.
          </span>
        </p>
      )}

      {canAdjust && <AdjustCard party={party} ownerId={ownerId} ownerName={ownerName} />}

      {transactions.length === 0 ? (
        <EmptyState
          title="Nothing on the statement yet"
          description={
            party === "rider"
              ? "Deliveries, bonuses and payouts all land here as they happen."
              : party === "customer"
                ? "Refunds, goodwill credit and anything spent at checkout all land here as they happen."
                : "Order earnings, adjustments and payouts all land here as they happen."
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>When</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Note</TableHeadCell>
              <TableHeadCell>Amount</TableHeadCell>
              <TableHeadCell>Balance</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {transactions.map((row) => (
              <tr key={row.id}>
                <TableCell className="text-text-secondary">{formatDateTime(row.createdAt)}</TableCell>
                <TableCell className="font-medium">
                  {row.typeLabel}
                  {row.orderNumber && (
                    <span className="mt-0.5 block text-xs font-normal text-text-muted">
                      {row.orderNumber}
                    </span>
                  )}
                </TableCell>
                <TableCell className="break-words text-text-secondary">{row.note ?? "—"}</TableCell>
                <TableCell
                  className={`font-medium ${row.isCredit ? "text-status-good" : "text-status-critical"}`}
                >
                  {/* Signed, because that is how a statement reads. */}
                  {row.isCredit ? "+" : "−"}
                  {formatCurrency(Math.abs(row.amount))}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {formatCurrency(row.balanceAfter)}
                </TableCell>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

function AdjustCard({
  party,
  ownerId,
  ownerName,
}: {
  party: WalletParty;
  ownerId: number;
  ownerName: string;
}) {
  const { notifySuccess } = useToast();
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);

    const result = await adjustWalletAction(party, ownerId, direction, {
      amount: Number(amount),
      note,
    });

    setPending(false);
    notifySuccess(result);

    if (result.ok) {
      setAmount("");
      setNote("");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm"
    >
      <h3 className="break-words text-sm font-semibold text-foreground">Adjust wallet</h3>
      <p className="text-sm text-text-secondary">
        Adds a line to {ownerName}&rsquo;s statement. A debit is refused if it would take the balance
        below zero.
      </p>
      {party === "customer" && (
        <p className="text-sm text-text-secondary">
          Credit added here is <span className="font-medium text-foreground">goodwill</span>: it can
          be spent on orders but never cashed out. To send real money back, refund the order it came
          from.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value={direction}
          onChange={(event) => setDirection(event.target.value as "credit" | "debit")}
          className="h-11 rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground focus:border-brand focus:ring-4 focus:ring-brand/10"
        >
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>

        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Amount"
          required
          className="h-11 w-36 rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground focus:border-brand focus:ring-4 focus:ring-brand/10"
        />

        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What is this for?"
          required
          minLength={5}
          maxLength={255}
          className="h-11 min-w-56 flex-1 rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground focus:border-brand focus:ring-4 focus:ring-brand/10"
        />

        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:opacity-50"
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>

      <p className="text-xs text-text-muted">
        The note is required and shown on the statement — a movement with no explanation is
        indistinguishable from a mistake six months later.
      </p>
    </form>
  );
}

function Figure({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <span className="break-words text-sm text-text-secondary">{label}</span>
      <span
        className={`break-words font-semibold tracking-tight text-foreground ${emphasis ? "text-2xl" : "text-lg"}`}
      >
        {value}
      </span>
    </div>
  );
}
