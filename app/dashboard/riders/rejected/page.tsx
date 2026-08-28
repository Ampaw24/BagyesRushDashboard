import type { Metadata } from "next";
import { RidersListPage } from "../_components/riders-list-page";

export const metadata: Metadata = {
  title: "Rejected Riders — BagyesRUSH",
};

export default async function RejectedRidersPage(props: PageProps<"/dashboard/riders/rejected">) {
  return (
    <RidersListPage
      title="Rejected riders"
      description="Applications that were turned down. They can fix what was flagged and resubmit."
      fixedStatus="rejected"
      searchParams={props.searchParams}
    />
  );
}
