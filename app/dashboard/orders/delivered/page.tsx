import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getOrders } from "../../_services/mock-data";
import { OrdersTable } from "../orders-table";

export const metadata: Metadata = {
  title: "Delivered Orders — Bagyes Rush Delivery",
};

export default async function DeliveredOrdersPage() {
  const orders = await getOrders();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Delivered orders" description="Orders successfully completed." />
      <OrdersTable orders={orders} initialStatus="delivered" />
    </div>
  );
}
