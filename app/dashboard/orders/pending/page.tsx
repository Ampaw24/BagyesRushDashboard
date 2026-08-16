import type { Metadata } from "next";
import { OrdersListPage } from "../_components/orders-list-page";

export const metadata: Metadata = {
  title: "Pending Orders — Bagyes Rush Delivery",
};

export default async function PendingOrdersPage(props: PageProps<"/dashboard/orders/pending">) {
  return (
    <OrdersListPage
      title="Pending orders"
      description="Orders placed and paid for, waiting for the vendor to accept."
      fixedStatus="pending"
      searchParams={props.searchParams}
    />
  );
}
