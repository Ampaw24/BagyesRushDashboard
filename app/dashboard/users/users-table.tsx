"use client";

import { useState } from "react";

import { ActionMenu } from "../_components/action-menu";
import { Avatar } from "../_components/avatar";
import { Badge } from "../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { EmptyState } from "../_components/empty-state";
import { Pagination } from "../_components/pagination";
import { FilterBar, type SelectFilter } from "../_components/filter-bar";
import { userStatusMeta } from "../_lib/status";
import { formatDate } from "../_lib/format";
import { useCustomerActions } from "../_hooks/use-customer-actions";
import { useSendMessage } from "../_hooks/use-send-message";
import { ViewCustomerDialog } from "./view-customer-dialog";
import type { CustomerRow } from "@/lib/mappers/customer.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import { USER_STATUSES, userStatusLabels } from "@/lib/types/enums";

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "All statuses",
  options: USER_STATUSES.map((status) => ({ value: status, label: userStatusLabels[status] })),
};

export function UsersTable({
  customers,
  pagination,
  openCustomerId,
  canMessage,
}: {
  customers: CustomerRow[];
  pagination: PaginationMeta;
  /** `communications.send` — sending SMS spends credits, so it is its own right. */
  canMessage: boolean;
  /**
   * Opened straight from the URL, so a payout or ledger row elsewhere on the
   * dashboard can link to a specific customer. Customers have no detail route
   * of their own — they are this dialog — so without it those links would land
   * on an unfiltered list and leave somebody scrolling.
   */
  openCustomerId?: number;
}) {
  const [viewing, setViewing] = useState<CustomerRow | null>(null);
  const [deepLinkClosed, setDeepLinkClosed] = useState(false);

  // Derived during render rather than synced into state by an effect: the
  // dialog to show is a function of the row that was clicked and the row the
  // URL asked for, and nothing external needs telling about it.
  const deepLinked =
    deepLinkClosed || openCustomerId === undefined
      ? null
      : (customers.find((customer) => customer.id === openCustomerId) ?? null);

  const showing = viewing ?? deepLinked;

  return (
    <div className="flex flex-col gap-4">
      <FilterBar searchPlaceholder="Search name, email or phone" filters={[STATUS_FILTER]} />

      {customers.length === 0 ? (
        <EmptyState
          title="No customers match your filters"
          description="Try a different search term or status."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Customer</TableHeadCell>
                <TableHeadCell>Email</TableHeadCell>
                <TableHeadCell>Phone</TableHeadCell>
                <TableHeadCell>Orders</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Joined</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <CustomerRowView
                  key={customer.id}
                  customer={customer}
                  canMessage={canMessage}
                  onView={() => setViewing(customer)}
                />
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}

      {showing && (
        <ViewCustomerDialog
          customer={showing}
          onClose={() => {
            setViewing(null);
            setDeepLinkClosed(true);
          }}
        />
      )}
    </div>
  );
}

function CustomerRowView({
  customer,
  canMessage,
  onView,
}: {
  customer: CustomerRow;
  canMessage: boolean;
  onView: () => void;
}) {
  const { actions, dialog } = useCustomerActions(customer);
  const { actions: messageActions, dialog: messageDialog } = useSendMessage(
    { userId: customer.userId, name: customer.fullName, phone: customer.phone },
    canMessage,
  );

  return (
    <tr>
      <TableCell className="font-medium">
        <span className="flex items-center gap-2.5">
          <Avatar name={customer.fullName} src={customer.avatarUrl} className="h-8 w-8 text-xs" />
          {customer.fullName}
        </span>
      </TableCell>
      <TableCell className="text-text-secondary">{customer.email ?? "—"}</TableCell>
      <TableCell className="text-text-secondary">{customer.phone ?? "—"}</TableCell>
      {/* `orders_count` is a list-only field; the detail endpoint drops it. */}
      <TableCell>{customer.ordersCount ?? "—"}</TableCell>
      <TableCell>
        <Badge meta={userStatusMeta[customer.status]} />
      </TableCell>
      <TableCell className="text-text-secondary">{formatDate(customer.joinedAt)}</TableCell>
      <TableCell>
        <ActionMenu
          items={[{ label: "View customer", onClick: onView }, ...messageActions, ...actions]}
        />
        {dialog}
        {messageDialog}
      </TableCell>
    </tr>
  );
}
