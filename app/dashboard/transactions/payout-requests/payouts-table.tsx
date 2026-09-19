"use client";

import Link from "next/link";
import { useState } from "react";

import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { Badge } from "../../_components/status-badge";
import { ActionMenu, type ActionMenuItem } from "../../_components/action-menu";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { EmptyState } from "../../_components/empty-state";
import { Pagination } from "../../_components/pagination";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { useToast } from "../../_components/toast-provider";
import { CheckCircleIcon, DangerIcon, RefreshIcon, WalletIcon } from "../../_lib/icons";
import { withdrawalStatusMeta } from "../../_lib/status";
import { formatCurrency, formatDateTime, formatDateTimeOrDash } from "../../_lib/format";
import {
  approveWithdrawalAction,
  markWithdrawalPaidAction,
  rejectWithdrawalAction,
  verifyWithdrawalAction,
} from "../_wallet-actions";
import type { WithdrawalRow } from "@/lib/mappers/wallet.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import { WITHDRAWAL_STATUSES, withdrawalStatusLabels, withdrawalStatusTransitions } from "@/lib/types/enums";
import { ownerHref } from "../_components/owner-href";

/**
 * Everybody queues together, so "vendor payouts" is this screen with one filter
 * applied rather than a second near-identical route.
 *
 * Customers only appear here once an admin has turned customer cash-out on, and
 * even then only for refund credit — goodwill credit can never become a payout
 * request. A request from a customer is worth a closer look than one from a
 * rider for exactly that reason, which is why the filter names them separately
 * rather than folding them in.
 */
const OWNER_FILTER: SelectFilter = {
  key: "owner_type",
  label: "Paying",
  allLabel: "Everyone",
  options: [
    { value: "rider", label: "Riders" },
    { value: "vendor", label: "Vendors" },
    { value: "customer", label: "Customers" },
  ],
};

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "All statuses",
  options: WITHDRAWAL_STATUSES.map((status) => ({
    value: status,
    label: withdrawalStatusLabels[status],
  })),
};

export function WithdrawalsTable({
  withdrawals,
  pagination,
  canProcess,
  showStatusFilter = true,
}: {
  withdrawals: WithdrawalRow[];
  pagination: PaginationMeta;
  canProcess: boolean;
  showStatusFilter?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchPlaceholder="Search reference, rider or account name"
        filters={showStatusFilter ? [OWNER_FILTER, STATUS_FILTER] : [OWNER_FILTER]}
      />

      {withdrawals.length === 0 ? (
        <EmptyState
          title="Nothing to pay out"
          description="Withdrawal requests appear here as soon as a rider asks to be paid."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Reference</TableHeadCell>
                <TableHeadCell>Paying</TableHeadCell>
                <TableHeadCell>Amount</TableHeadCell>
                <TableHeadCell>Destination</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Requested</TableHeadCell>
                <TableHeadCell>Settled</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <Row key={withdrawal.id} withdrawal={withdrawal} canProcess={canProcess} />
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}
    </div>
  );
}

type Pending = "approve" | "reject" | "mark_paid" | null;

function Row({ withdrawal, canProcess }: { withdrawal: WithdrawalRow; canProcess: boolean }) {
  const [pending, setPending] = useState<Pending>(null);
  const { notify } = useToast();

  // Derived from WithdrawalStatus::allowedTransitions(), so the menu can never
  // offer a move the API would reject.
  const allowed = withdrawalStatusTransitions[withdrawal.status] ?? [];
  const actions: ActionMenuItem[] = [];

  if (canProcess) {
    if (allowed.includes("approved")) {
      actions.push({
        label: "Approve",
        icon: CheckCircleIcon,
        onClick: () => setPending("approve"),
      });
    }

    if (allowed.includes("paid")) {
      actions.push({
        label: "Mark as paid",
        icon: WalletIcon,
        onClick: () => setPending("mark_paid"),
      });
    }

    if (allowed.includes("rejected")) {
      actions.push({
        label: "Reject",
        icon: DangerIcon,
        danger: true,
        onClick: () => setPending("reject"),
      });
    }

    // Only on `approved`, which is the one state where the answer is unknown:
    // the transfer was handed to the provider and the settlement webhook has
    // not come back. Before this, a webhook that never landed left the money
    // reserved with no way to find out but the Paystack dashboard.
    //
    // Nothing destructive happens either way - the endpoint reports what the
    // provider says and settles only if it says the transfer completed - so
    // there is no confirmation step in front of it.
    if (withdrawal.status === "approved") {
      actions.push({
        label: "Verify with provider",
        icon: RefreshIcon,
        // Returning the promise is what makes ActionMenu hold the row and show
        // a spinner; it locks every other item on the row while this runs.
        onClick: async () => {
          // `notify`, not `notifySuccess`: "the provider has never heard of
          // this reference" is the answer this exists to surface, and it
          // arrives as a failure. Swallowing it would leave the admin staring
          // at an unchanged row with no idea why.
          notify(await verifyWithdrawalAction(withdrawal.id));
        },
      });
    }
  }

  return (
    <tr>
      <TableCell className="font-medium">{withdrawal.reference}</TableCell>
      <TableCell className="text-text-secondary">
        {/* Riders and vendors share this queue: the link goes wherever this
            one belongs, and the kind is labelled so a finance screen never has
            to guess which sort of payout it is looking at. */}
        {withdrawal.ownerId && withdrawal.ownerType ? (
          <Link
            href={ownerHref(withdrawal.ownerType, withdrawal.ownerId)}
            className="hover:text-brand"
          >
            {withdrawal.ownerName}
          </Link>
        ) : (
          (withdrawal.ownerName ?? "—")
        )}
        {withdrawal.ownerType && (
          <span className="mt-0.5 block text-xs capitalize text-text-muted">
            {withdrawal.ownerType}
          </span>
        )}
      </TableCell>
      <TableCell className="font-medium">
        {formatCurrency(withdrawal.amount)}
      </TableCell>
      <TableCell className="text-text-secondary">
        {withdrawal.destinationProvider ?? (withdrawal.destinationType === "bank" ? "Bank" : "Mobile money")}
        {/* Last four only — the full account number is never returned. */}
        {withdrawal.destinationLast4 && (
          <span className="mt-0.5 block text-xs text-text-muted">
            •••• {withdrawal.destinationLast4}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Badge meta={withdrawalStatusMeta[withdrawal.status]} />
        {withdrawal.rejectionReason && (
          <span className="mt-0.5 block break-words text-xs text-text-muted">
            {withdrawal.rejectionReason}
          </span>
        )}
      </TableCell>
      <TableCell className="text-text-secondary">{formatDateTime(withdrawal.requestedAt)}</TableCell>
      <TableCell className="text-text-secondary">
        {formatDateTimeOrDash(withdrawal.paidAt)}
        {withdrawal.paymentReference && (
          <span className="mt-0.5 block text-xs text-text-muted">{withdrawal.paymentReference}</span>
        )}
      </TableCell>
      <TableCell>
        {actions.length > 0 ? <ActionMenu items={actions} /> : <span className="text-sm text-text-muted">—</span>}
        {pending && (
          <ProcessDialog
            withdrawal={withdrawal}
            action={pending}
            onClose={() => setPending(null)}
          />
        )}
      </TableCell>
    </tr>
  );
}

function ProcessDialog({
  withdrawal,
  action,
  onClose,
}: {
  withdrawal: WithdrawalRow;
  action: Exclude<Pending, null>;
  onClose: () => void;
}) {
  const { notifySuccess } = useToast();
  const [reference, setReference] = useState("");

  const amount = formatCurrency(withdrawal.amount);

  const copy = {
    approve: {
      title: "Approve withdrawal",
      description: `${amount} to ${withdrawal.ownerName}. Approving does not send the money — it clears it for payment.`,
      confirm: "Approve",
      danger: false,
    },
    mark_paid: {
      title: "Mark as paid",
      description: `Confirm that ${amount} has actually been sent to ${withdrawal.ownerName}. This records what you did; it does not move any money.`,
      confirm: "Mark as paid",
      danger: false,
    },
    reject: {
      title: "Reject withdrawal",
      description: `${withdrawal.ownerName} will be told why, and ${amount} goes back into their wallet.`,
      confirm: "Reject",
      danger: true,
    },
  }[action];

  return (
    <ConfirmDialog
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirm}
      danger={copy.danger}
      requireReason={action === "reject"}
      reasonMinLength={5}
      onCancel={onClose}
      onConfirm={async (reason) => {
        const result =
          action === "approve"
            ? await approveWithdrawalAction(withdrawal.id)
            : action === "reject"
              ? await rejectWithdrawalAction(withdrawal.id, reason ?? "")
              : await markWithdrawalPaidAction(withdrawal.id, reference || undefined);

        notifySuccess(result);
        if (result.ok) onClose();
        return result;
      }}
    >
      {action === "mark_paid" && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Payment reference (optional)</span>
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="e.g. MTN-TXN-99887"
            className="h-11 rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
          <span className="text-xs text-text-muted">
            Whatever the transfer was called at the bank or network, so this and the statement can be
            reconciled later.
          </span>
        </label>
      )}
    </ConfirmDialog>
  );
}
