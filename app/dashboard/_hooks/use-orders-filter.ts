import { useMemo, useState } from "react";
import type { OrderStatus } from "../_lib/status";
import type { Order } from "../_services/mock-data";

export type OrderStatusFilter = OrderStatus | "all";

export function useOrdersFilter(orders: Order[], initialStatus: OrderStatusFilter = "all") {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatusFilter>(initialStatus);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        order.id.toLowerCase().includes(normalizedQuery) ||
        order.customer.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, status]);

  return { query, setQuery, status, setStatus, filtered };
}
