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
}: {
  customers: CustomerRow[];
  pagination: PaginationMeta;
}) {
  const [viewing, setViewing] = useState<CustomerRow | null>(null);

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
                <CustomerRowView key={customer.id} customer={customer} onView={() => setViewing(customer)} />
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}

      {viewing && <ViewCustomerDialog customer={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function CustomerRowView({ customer, onView }: { customer: CustomerRow; onView: () => void }) {
  const { actions, dialog } = useCustomerActions(customer);

  return (
    <tr>
      <TableCell className="font-medium">
        <span className="flex items-center gap-2.5">
          <Avatar name={customer.fullName} className="h-8 w-8 text-xs" />
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
        <ActionMenu items={[{ label: "View customer", onClick: onView }, ...actions]} />
        {dialog}
      </TableCell>
    </tr>
  );
}
