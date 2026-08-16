import type { Metadata } from "next";
import { OrdersListPage } from "./_components/orders-list-page";

export const metadata: Metadata = {
  title: "Orders — Bagyes Rush Delivery",
};

export default async function OrdersPage(props: PageProps<"/dashboard/orders">) {
  return (
    <OrdersListPage
      title="Orders"
      description="Search and filter every order moving through the network."
      searchParams={props.searchParams}
    />
  );
}
