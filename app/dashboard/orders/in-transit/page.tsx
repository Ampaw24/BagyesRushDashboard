import type { Metadata } from "next";
import { OrdersListPage } from "../_components/orders-list-page";

export const metadata: Metadata = {
  title: "Orders In Transit — BagyesRUSH",
};

export default async function InTransitOrdersPage(props: PageProps<"/dashboard/orders/in-transit">) {
  return (
    <OrdersListPage
      title="Orders in transit"
      description="Orders that have left the vendor and are on their way to the customer."
      fixedStatus="out_for_delivery"
      searchParams={props.searchParams}
    />
  );
}
