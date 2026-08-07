import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getOrders } from "../../_services/mock-data";
import { OrdersTable } from "../orders-table";

export const metadata: Metadata = {
  title: "In Transit Orders — Bagyes Rush Delivery",
};

export default async function InTransitOrdersPage() {
  const orders = await getOrders();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="In transit orders" description="Orders currently on their way with a rider." />
      <OrdersTable orders={orders} initialStatus="in_transit" />
    </div>
  );
}
