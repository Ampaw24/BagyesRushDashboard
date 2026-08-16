import type { Metadata } from "next";
import { VendorsListPage } from "../_components/vendors-list-page";

export const metadata: Metadata = {
  title: "Vendor Applications — Bagyes Rush Delivery",
};

/**
 * The backend has no separate applications table — an application *is* a
 * vendor in `pending_review`, which is also what /vendors/pending shows.
 */
export default async function VendorApplicationsPage(
  props: PageProps<"/dashboard/vendors/applications">,
) {
  return (
    <VendorsListPage
      title="Vendor applications"
      description="New businesses awaiting review. Approve or reject each one with a reason."
      fixedStatus="pending_review"
      searchParams={props.searchParams}
    />
  );
}
