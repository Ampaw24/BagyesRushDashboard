import type { Metadata } from "next";
import { OrdersListPage } from "../_components/orders-list-page";

export const metadata: Metadata = {
  title: "Cancelled Orders — BagyesRUSH",
};

export default async function CancelledOrdersPage(props: PageProps<"/dashboard/orders/cancelled">) {
  return (
    <OrdersListPage
      title="Cancelled orders"
      // Rejected is a separate backend status — it is reachable from the status
      // filter on the All Orders page.
      description="Orders cancelled before delivery."
      fixedStatus="cancelled"
      searchParams={props.searchParams}
    />
  );
}
