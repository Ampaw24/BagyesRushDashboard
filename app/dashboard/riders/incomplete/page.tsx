import type { Metadata } from "next";
import { RidersListPage } from "../_components/riders-list-page";

export const metadata: Metadata = {
  title: "Incomplete Riders — BagyesRUSH",
};

export default async function IncompleteRidersPage(props: PageProps<"/dashboard/riders/incomplete">) {
  return (
    <RidersListPage
      title="Incomplete riders"
      description="Registered but never finished onboarding. There is nothing to review yet — these are people worth chasing."
      fixedStatus="pending_review"
      fixedProfileComplete={false}
      searchParams={props.searchParams}
    />
  );
}
