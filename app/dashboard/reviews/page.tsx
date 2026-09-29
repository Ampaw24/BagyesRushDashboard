import type { Metadata } from "next";

import { PageHeader } from "../_components/page-header";
import { StatTile } from "../_components/stat-tile";
import { NoPermissionState } from "../_components/empty-state";
import { StarIcon, EyeIcon, ChatIcon } from "../_lib/icons";
import { formatCompactNumber } from "../_lib/format";
import { ReviewsTable } from "./reviews-table";
import { listReviews } from "@/lib/services/reviews.service";
import { getDashboard } from "@/lib/services/dashboard.service";
import { toReviewRow } from "@/lib/mappers/catalogue.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam, readNumberParam } from "@/lib/api/query";

export const metadata: Metadata = {
  title: "Reviews — BagyesRUSH",
};

export default async function ReviewsPage(props: PageProps<"/dashboard/reviews">) {
  const permissions = await getPermissions();

  if (!can(permissions, "reviews.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Reviews" description="What customers are saying about vendors." />
        <NoPermissionState what="reviews" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const rating = readNumberParam(params, "rating");

  // Guarded the same way the rating is: a hand-edited URL must not 422 the page.
  const subjectParam = params.subject;
  const subject = subjectParam === "vendor" || subjectParam === "rider" ? subjectParam : undefined;

  const [page, dashboard] = await Promise.all([
    listReviews({
      page: list.page,
      per_page: list.per_page,
      subject,
      // Guard the range so a hand-edited URL cannot 422 the page.
      rating: rating !== undefined && rating >= 1 && rating <= 5 ? rating : undefined,
      is_visible: readBooleanParam(params, "is_visible"),
      vendor_id: readNumberParam(params, "vendor_id"),
      rider_id: readNumberParam(params, "rider_id"),
    }),
    // The reviews summary lives on the dashboard endpoint, which every admin
    // who can see reviews also has access to.
    getDashboard(),
  ]);

  const summary = dashboard.reviews;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reviews"
        description="What customers say about the kitchen and about the courier. One order is one review, and it may rate either or both. Hiding one removes it from the storefront and from the average, but keeps the row."
      />

      {/*
        The two averages are deliberately separate. One figure across both would
        mix the food and the courier into a number that describes neither, and
        would move when the split between food orders and parcels moved rather
        than when service changed.
      */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile
          label="Total reviews"
          value={formatCompactNumber(summary.total)}
          icon={<StarIcon className="h-4.5 w-4.5" />}
        />
        <StatTile
          label="Vendor average"
          value={summary.average_vendor_rating.toFixed(1)}
          hint={`${formatCompactNumber(summary.vendor_rating_count)} rated`}
          icon={<StarIcon className="h-4.5 w-4.5" />}
        />
        <StatTile
          label="Rider average"
          value={summary.average_rider_rating.toFixed(1)}
          hint={`${formatCompactNumber(summary.rider_rating_count)} rated`}
          icon={<StarIcon className="h-4.5 w-4.5" />}
        />
        <StatTile
          label="Hidden by moderation"
          value={formatCompactNumber(summary.hidden_by_moderation)}
          icon={<EyeIcon className="h-4.5 w-4.5" />}
        />
        <StatTile
          label="Awaiting vendor reply"
          value={formatCompactNumber(summary.awaiting_vendor_reply)}
          icon={<ChatIcon className="h-4.5 w-4.5" />}
        />
      </div>

      <ReviewsTable
        reviews={page.items.map(toReviewRow)}
        pagination={page.pagination}
        canModerate={can(permissions, "reviews.moderate")}
      />
    </div>
  );
}
