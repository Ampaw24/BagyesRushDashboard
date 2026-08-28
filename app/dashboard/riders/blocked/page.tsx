import type { Metadata } from "next";
import { RidersListPage } from "../_components/riders-list-page";

export const metadata: Metadata = {
  title: "Blocked Riders — BagyesRUSH",
};

export default async function BlockedRidersPage(props: PageProps<"/dashboard/riders/blocked">) {
  return (
    <RidersListPage
      title="Blocked riders"
      description="Suspended accounts. They are offline, signed out, and receive no jobs until reinstated."
      fixedStatus="suspended"
      searchParams={props.searchParams}
    />
  );
}
