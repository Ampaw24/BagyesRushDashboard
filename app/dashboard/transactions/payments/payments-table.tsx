"use client";

import Link from "next/link";
import { useState } from "react";

import { ActionMenu } from "../../_components/action-menu";
import { Badge } from "../../_components/status-badge";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { EmptyState } from "../../_components/empty-state";
import { Pagination } from "../../_components/pagination";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { paymentStatusMeta } from "../../_lib/status";
import { RefreshIcon } from "../../_lib/icons";
import { useToast } from "../../_components/toast-provider";
import { formatCurrency, formatDateTime, formatDateTimeOrDash } from "../../_lib/format";
import { verifyPaymentAction } from "../_actions";
import type { PaymentRow } from "@/lib/mappers/payment.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  paymentMethodLabels,
  paymentStatusLabels,
} from "@/lib/types/enums";

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "All statuses",
  options: PAYMENT_STATUSES.map((status) => ({ value: status, label: paymentStatusLabels[status] })),
};

const METHOD_FILTER: SelectFilter = {
  key: "method",
  label: "Method",
  allLabel: "All methods",
  options: PAYMENT_METHODS.map((method) => ({ value: method, label: paymentMethodLabels[method] })),
};

/**
 * Customer payments from `/admin/payments`.
 *
 * This reads the payments table directly rather than deriving figures from
 * orders, so a payment that succeeded at the gateway against an order that
 * never settled is visible here.
 */
export function PaymentsTable({
  payments,
  pagination,
  canVerify,
}: {
  payments: PaymentRow[];
  pagination: PaginationMeta;
  canVerify: boolean;
}) {
  const [verifying, setVerifying] = useState<PaymentRow | null>(null);
  const { notifySuccess } = useToast();

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchPlaceholder="Search reference or order number"
        filters={[STATUS_FILTER, METHOD_FILTER]}
      />

      {payments.length === 0 ? (
        <EmptyState
          title="No payments match your filters"
          description="Try a different search term, status or method."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Reference</TableHeadCell>
                <TableHeadCell>Order</TableHeadCell>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell>Customer</TableHeadCell>
                <TableHeadCell>Method</TableHeadCell>
                <TableHeadCell>Amount</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Paid</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                {canVerify && (
                  <TableHeadCell>
                    <span className="sr-only">Actions</span>
                  </TableHeadCell>
                )}
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <TableCell className="font-medium">{payment.reference}</TableCell>
                  <TableCell>
                    {payment.orderId ? (
                      <Link
                        href={`/dashboard/orders/${payment.orderId}`}
                        className="text-brand transition duration-150 hover:opacity-80"
                      >
                        {payment.orderNumber}
                      </Link>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary">{payment.vendorName ?? "—"}</TableCell>
                  <TableCell className="text-text-secondary">{payment.customerName ?? "—"}</TableCell>
                  <TableCell className="text-text-secondary">{payment.methodLabel}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <Badge meta={paymentStatusMeta[payment.status]} />
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {formatDateTimeOrDash(payment.paidAt)}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {formatDateTime(payment.createdAt)}
                  </TableCell>
                  {canVerify && (
                    <TableCell>
                      <ActionMenu
                        items={[
                          {
                            label: "Re-check with gateway",
                            icon: RefreshIcon,
                            onClick: () => setVerifying(payment),
                          },
                        ]}
                      />
                    </TableCell>
                  )}
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}

      {verifying && (
        <ConfirmDialog
          title="Re-check this payment?"
          description={`Asks the payment provider for the current state of ${verifying.reference} and updates the order to match.`}
          confirmLabel="Re-check"
          onCancel={() => setVerifying(null)}
          onConfirm={async () => {
            const result = await verifyPaymentAction(verifying.id);
            notifySuccess(result);
            if (result.ok) setVerifying(null);
            return result;
          }}
        />
      )}
    </div>
  );
}
