import type { Metadata } from "next";
import { OrdersListPage } from "../_components/orders-list-page";

export const metadata: Metadata = {
  title: "Delivered Orders — Bagyes Rush Delivery",
};

export default async function DeliveredOrdersPage(props: PageProps<"/dashboard/orders/delivered">) {
  return (
    <OrdersListPage
      title="Delivered orders"
      description="Orders confirmed as delivered to the customer."
      fixedStatus="delivered"
      searchParams={props.searchParams}
    />
  );
}
