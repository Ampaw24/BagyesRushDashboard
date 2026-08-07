import type { Metadata } from "next";
import { PageHeader } from "../_components/page-header";
import { Badge } from "../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { customerStatusMeta } from "../_lib/status";
import { formatCurrency, formatDate } from "../_lib/format";
import { getCustomers } from "../_services/mock-data";

export const metadata: Metadata = {
  title: "Users — Bagyes Rush Delivery",
};

export default async function UsersPage() {
  const customers = await getCustomers();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users" description="Customers ordering through Bagyes Rush." />

      <TableShell>
        <thead>
          <tr>
            <TableHeadCell>Customer</TableHeadCell>
            <TableHeadCell>Email</TableHeadCell>
            <TableHeadCell>Phone</TableHeadCell>
            <TableHeadCell>Orders</TableHeadCell>
            <TableHeadCell>Total spent</TableHeadCell>
            <TableHeadCell>Joined</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell className="text-text-secondary">{customer.email}</TableCell>
              <TableCell className="text-text-secondary">{customer.phone}</TableCell>
              <TableCell>{customer.ordersCount}</TableCell>
              <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
              <TableCell className="text-text-secondary">{formatDate(customer.joinedAt)}</TableCell>
              <TableCell>
                <Badge meta={customerStatusMeta[customer.status]} />
              </TableCell>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}
