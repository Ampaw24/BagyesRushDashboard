import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { OrdersTable } from "../orders-table";
import { listOrders } from "@/lib/services/orders.service";
import { toOrderRow } from "@/lib/mappers/order.mapper";
import { getPermissions, can } from "@/lib/auth/guard";
import { parseListParams, readEnumParam, readParam, type SearchParams } from "@/lib/api/query";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus } from "@/lib/types/enums";

/**
 * Shared body for the five order list routes.
 *
 * `ListOrdersRequest.status` takes a single value, so each sub-page pins one
 * backend status rather than grouping several. Everything else — search,
 * payment status, date range, page — comes from the URL.
 */
export async function OrdersListPage({
  title,
  description,
  fixedStatus,
  searchParams,
}: {
  title: string;
  description: string;
  fixedStatus?: OrderStatus;
  searchParams: Promise<SearchParams>;
}) {
  const permissions = await getPermissions();
  if (!can(permissions, "orders.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={title} description={description} />
        <NoPermissionState what="orders" />
      </div>
    );
  }

  const params = await searchParams;
  const list = parseListParams(params);

  const page = await listOrders({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    status: fixedStatus ?? readEnumParam(params, "status", ORDER_STATUSES),
    payment_status: readEnumParam(params, "payment_status", PAYMENT_STATUSES),
    from: readParam(params, "from"),
    to: readParam(params, "to"),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} order{page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      <OrdersTable
        orders={page.items.map(toOrderRow)}
        pagination={page.pagination}
        showStatusFilter={fixedStatus === undefined}
      />
    </div>
  );
}
