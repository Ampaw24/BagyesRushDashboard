import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getOrders } from "../../_services/mock-data";
import { OrdersTable } from "../orders-table";

export const metadata: Metadata = {
  title: "Pending Orders — Bagyes Rush Delivery",
};

export default async function PendingOrdersPage() {
  const orders = await getOrders();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Pending orders" description="Orders waiting to be picked up by a rider." />
      <OrdersTable orders={orders} initialStatus="pending" />
    </div>
  );
}
