import { Badge } from "../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { transactionStatusMeta } from "../_lib/status";
import { formatCurrency, formatDateTime } from "../_lib/format";
import type { Transaction } from "../_services/mock-data";

const TYPE_LABEL: Record<Transaction["type"], string> = {
  earning: "Earning",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
};

export function TransactionsTable({ transactions, showType = true }: { transactions: Transaction[]; showType?: boolean }) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-foreground">No transactions yet</p>
        <p className="text-sm text-text-muted">They&apos;ll show up here as they happen.</p>
      </div>
    );
  }

  return (
    <TableShell>
      <thead>
        <tr>
          <TableHeadCell>ID</TableHeadCell>
          <TableHeadCell>Party</TableHeadCell>
          {showType && <TableHeadCell>Type</TableHeadCell>}
          <TableHeadCell>Amount</TableHeadCell>
          <TableHeadCell>Status</TableHeadCell>
          <TableHeadCell>Date</TableHeadCell>
        </tr>
      </thead>
      <tbody>
        {transactions.map((txn) => (
          <tr key={txn.id}>
            <TableCell className="font-medium">{txn.id}</TableCell>
            <TableCell className="text-text-secondary">{txn.party}</TableCell>
            {showType && <TableCell className="text-text-secondary">{TYPE_LABEL[txn.type]}</TableCell>}
            <TableCell className={txn.type === "withdrawal" ? "text-text-secondary" : "text-delta-good"}>
              {txn.type === "withdrawal" ? "-" : "+"}
              {formatCurrency(txn.amount)}
            </TableCell>
            <TableCell>
              <Badge meta={transactionStatusMeta[txn.status]} />
            </TableCell>
            <TableCell className="text-text-secondary">{formatDateTime(txn.date)}</TableCell>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
