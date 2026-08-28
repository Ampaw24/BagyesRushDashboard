"use client";

import { useState } from "react";

import { TableCell, TableHeadCell, TableShell } from "../../../_components/table-shell";
import { EmptyState } from "../../../_components/empty-state";
import { useToast } from "../../../_components/toast-provider";
import { formatCurrency, formatDateTime } from "../../../_lib/format";
import { adjustWalletAction } from "../../../transactions/_wallet-actions";
import type { WalletSummary, WalletTransactionRow } from "@/lib/mappers/wallet.mapper";

/**
 * A rider's money, from the staff side.
 *
 * The statement is the record; the balance at the top is a cached total the
 * backend keeps in step with it. Every adjustment posted here appends a row
 * rather than editing one, which is what leaves a trail somebody can follow
 * afterwards.
 */
export function WalletTab({
  riderId,
  riderName,
  summary,
  transactions,
  canAdjust,
}: {
  riderId: number;
  riderName: string;
  /** Null when the admin lacks `riders.wallet` — a separate permission. */
  summary: WalletSummary | null;
  transactions: WalletTransactionRow[];
  canAdjust: boolean;
}) {
  if (!summary) {
    return (
      <EmptyState
        title="Wallet is not visible to your role"
        description="Seeing or moving a rider's money needs the riders.wallet permission, which is separate from managing them."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Figure label="Balance" value={formatCurrency(summary.balance)} emphasis />
        <Figure label="Reserved for payout" value={formatCurrency(summary.pendingWithdrawal)} />
        <Figure label="Earned all time" value={formatCurrency(summary.lifetimeEarned)} />
        <Figure label="Withdrawn all time" value={formatCurrency(summary.lifetimeWithdrawn)} />
      </div>

      {!summary.hasPayoutDetails && (
        <p className="break-words rounded-xl border border-status-warning/30 bg-status-warning/5 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">No payout destination. </span>
          <span className="text-text-secondary">
            {riderName} cannot be paid until they add a bank account or mobile money number.
          </span>
        </p>
      )}

      {canAdjust && <AdjustCard riderId={riderId} riderName={riderName} />}

      {transactions.length === 0 ? (
        <EmptyState
          title="Nothing on the statement yet"
          description="Deliveries, bonuses and payouts all land here as they happen."
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

function AdjustCard({ riderId, riderName }: { riderId: number; riderName: string }) {
  const { notifySuccess } = useToast();
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);

    const result = await adjustWalletAction(riderId, direction, {
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
        Adds a line to {riderName}&rsquo;s statement. A debit is refused if it would take the balance
        below zero.
      </p>

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
