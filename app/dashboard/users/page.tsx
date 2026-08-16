import type { Metadata } from "next";

import { PageHeader } from "../_components/page-header";
import { StatTile } from "../_components/stat-tile";
import { NoPermissionState } from "../_components/empty-state";
import { UsersIcon } from "../_lib/icons";
import { formatCompactNumber } from "../_lib/format";
import { UsersTable } from "./users-table";
import { listCustomers } from "@/lib/services/customers.service";
import { toCustomerRow } from "@/lib/mappers/customer.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readEnumParam } from "@/lib/api/query";
import { USER_STATUSES } from "@/lib/types/enums";

export const metadata: Metadata = {
  title: "Customers — Bagyes Rush Delivery",
};

export default async function CustomersPage(props: PageProps<"/dashboard/users">) {
  const permissions = await getPermissions();

  if (!can(permissions, "customers.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Customers" description="Everyone who orders on the platform." />
        <NoPermissionState what="customers" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);
  const status = readEnumParam(params, "status", USER_STATUSES);

  const page = await listCustomers({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    status,
  });

  // The API has no customer-overview endpoint, so the only honest headline
  // figure is the total the current query matched.
  const heading = status ? `${status === "active" ? "Active" : "Suspended"} customers` : "All customers";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customers" description="Everyone who orders on the platform." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={heading}
          value={formatCompactNumber(page.pagination.total)}
          icon={<UsersIcon className="h-4.5 w-4.5" />}
        />
      </div>

      <UsersTable customers={page.items.map(toCustomerRow)} pagination={page.pagination} />
    </div>
  );
}
