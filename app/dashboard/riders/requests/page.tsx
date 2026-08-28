import type { Metadata } from "next";
import { RidersListPage } from "../_components/riders-list-page";

export const metadata: Metadata = {
  title: "Rider Requests — BagyesRUSH",
};

export default async function RiderRequestsPage(props: PageProps<"/dashboard/riders/requests">) {
  return (
    <RidersListPage
      title="Rider requests"
      description="Completed applications waiting on a decision. Approving one lets them go online and start taking jobs."
      fixedStatus="pending_review"
      fixedProfileComplete
      searchParams={props.searchParams}
    />
  );
}
