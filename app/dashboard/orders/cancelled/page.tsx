import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getOrders } from "../../_services/mock-data";
import { OrdersTable } from "../orders-table";

export const metadata: Metadata = {
  title: "Cancelled Orders — Bagyes Rush Delivery",
};

export default async function CancelledOrdersPage() {
  const orders = await getOrders();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Cancelled orders" description="Orders that were cancelled before completion." />
      <OrdersTable orders={orders} initialStatus="cancelled" />
    </div>
  );
}
