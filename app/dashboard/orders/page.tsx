import type { Metadata } from "next";
import { PageHeader } from "../_components/page-header";
import { getOrders } from "../_services/mock-data";
import { OrdersTable } from "./orders-table";

export const metadata: Metadata = {
  title: "Orders — Bagyes Rush Delivery",
};

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Orders" description="Search and filter every order moving through the network." />
      <OrdersTable orders={orders} />
    </div>
  );
}
