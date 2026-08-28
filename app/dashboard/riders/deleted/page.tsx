import type { Metadata } from "next";
import { RidersListPage } from "../_components/riders-list-page";

export const metadata: Metadata = {
  title: "Deleted Riders — BagyesRUSH",
};

export default async function DeletedRidersPage(props: PageProps<"/dashboard/riders/deleted">) {
  return (
    <RidersListPage
      title="Deleted riders"
      description="Soft-deleted accounts. Nothing is lost — restoring one brings it back with its previous status."
      trashedOnly
      searchParams={props.searchParams}
    />
  );
}
