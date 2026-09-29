"use client";

import Link from "next/link";
import { useState } from "react";

import { ActionMenu } from "../_components/action-menu";
import { Avatar } from "../_components/avatar";
import { Badge } from "../_components/status-badge";
import { ConfirmDialog } from "../_components/confirm-dialog";
import { EmptyState } from "../_components/empty-state";
import { FilterBar, type SelectFilter } from "../_components/filter-bar";
import { Pagination } from "../_components/pagination";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { EyeIcon, StarIcon, TrashIcon } from "../_lib/icons";
import { useToast } from "../_components/toast-provider";
import { formatDate } from "../_lib/format";
import { deleteReviewAction, toggleReviewVisibilityAction } from "./_actions";
import type { ReviewRow } from "@/lib/mappers/catalogue.mapper";
import type { PaginationMeta } from "@/lib/api/types";

/**
 * Which half of a review the list is of.
 *
 * Not cosmetic: a review rates the kitchen, the courier or both, so without
 * narrowing, "rider ratings" would list every food review with an empty rider
 * column. The server does the narrowing, and `rating` filters against whichever
 * half this names.
 */
const SUBJECT_FILTER: SelectFilter = {
  key: "subject",
  label: "Rated",
  allLabel: "Vendors and riders",
  options: [
    { value: "vendor", label: "Vendor ratings" },
    { value: "rider", label: "Rider ratings" },
  ],
};

const RATING_FILTER: SelectFilter = {
  key: "rating",
  label: "Rating",
  allLabel: "All ratings",
  options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n === 1 ? "" : "s"}` })),
};

const VISIBILITY_FILTER: SelectFilter = {
  key: "is_visible",
  label: "Visibility",
  allLabel: "Visible and hidden",
  options: [
    { value: "1", label: "Visible only" },
    { value: "0", label: "Hidden only" },
  ],
};

const VISIBLE_META = { label: "Visible", dotClassName: "bg-status-good", badgeClassName: "bg-status-good/10 text-status-good" };
const HIDDEN_META = { label: "Hidden", dotClassName: "bg-status-critical", badgeClassName: "bg-status-critical/10 text-status-critical" };

type Dialog = { kind: "hide" | "delete"; review: ReviewRow } | null;

/**
 * Review moderation.
 *
 * The API also accepts `with_comment` and `unanswered` filters, but the service
 * ignores both — so they are not offered here rather than shipping controls
 * that appear to work and do nothing.
 */
export function ReviewsTable({
  reviews,
  pagination,
  canModerate,
}: {
  reviews: ReviewRow[];
  pagination: PaginationMeta;
  canModerate: boolean;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const { notifySuccess } = useToast();

  return (
    <div className="flex flex-col gap-4">
      {/* No search box: ListReviewsRequest takes no `search` param. */}
      <FilterBar searchable={false} filters={[SUBJECT_FILTER, RATING_FILTER, VISIBILITY_FILTER]} />

      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews match your filters"
          description="Customer reviews appear here once orders are delivered."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Customer</TableHeadCell>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell>Rider</TableHeadCell>
                <TableHeadCell>Comment</TableHeadCell>
                <TableHeadCell>Rated</TableHeadCell>
                <TableHeadCell>Order</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
                {canModerate && (
                  <TableHeadCell>
                    <span className="sr-only">Actions</span>
                  </TableHeadCell>
                )}
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={review.authorName} className="h-8 w-8 text-xs" />
                      {/* Anonymised by the API to "First L." */}
                      {review.authorName}
                    </span>
                  </TableCell>
                  {/*
                    Each half gets its own score column. A single "rating"
                    column would have to pick one of the two, and on a review
                    that rated both it would silently hide the other.
                  */}
                  <TableCell>
                    <Score value={review.vendorRating} />
                  </TableCell>
                  <TableCell>
                    <Score value={review.riderRating} />
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    <Comments review={review} />
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    <span className="flex flex-col gap-0.5">
                      {review.vendorId ? (
                        <Link
                          href={`/dashboard/vendors/${review.vendorId}`}
                          className="text-brand transition duration-150 hover:opacity-80"
                        >
                          {review.vendorName}
                        </Link>
                      ) : (
                        <span className="text-text-muted">Parcel — no vendor</span>
                      )}
                      {review.riderId && (
                        <Link
                          href={`/dashboard/riders/${review.riderId}`}
                          className="text-xs text-brand transition duration-150 hover:opacity-80"
                        >
                          {review.riderName ?? "Rider"}
                        </Link>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {review.orderId ? (
                      <Link
                        href={`/dashboard/orders/${review.orderId}`}
                        className="text-brand transition duration-150 hover:opacity-80"
                      >
                        {review.orderNumber}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge meta={review.isVisible ? VISIBLE_META : HIDDEN_META} />
                  </TableCell>
                  <TableCell className="text-text-secondary">{formatDate(review.createdAt)}</TableCell>
                  {canModerate && (
                    <TableCell>
                      <ActionMenu
                        items={[
                          {
                            label: review.isVisible ? "Hide review" : "Show review",
                            icon: EyeIcon,
                            onClick: () => setDialog({ kind: "hide", review }),
                          },
                          {
                            label: "Delete review",
                            icon: TrashIcon,
                            danger: true,
                            onClick: () => setDialog({ kind: "delete", review }),
                          },
                        ]}
                      />
                    </TableCell>
                  )}
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}

      {dialog?.kind === "hide" && (
        <ConfirmDialog
          title={dialog.review.isVisible ? "Hide this review?" : "Show this review?"}
          description={
            dialog.review.isVisible
              ? "It will stop appearing on the vendor's storefront. The rating still counts toward their average."
              : "It will appear on the vendor's storefront again."
          }
          confirmLabel={dialog.review.isVisible ? "Hide" : "Show"}
          danger={dialog.review.isVisible}
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await toggleReviewVisibilityAction(dialog.review.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}

      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Delete this review?"
          description="The review is removed permanently and stops counting toward the vendor's rating."
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await deleteReviewAction(dialog.review.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

/**
 * A star score, or an honest dash.
 *
 * A missing half is not a zero — "the customer did not rate the rider" and "the
 * customer gave the rider nothing" are different facts, and rendering 0 for the
 * first is the kind of thing somebody acts on.
 */
function Score({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-text-muted">—</span>;
  }

  return (
    <span className="flex items-center gap-1 whitespace-nowrap">
      <StarIcon className="h-4 w-4 text-brand" />
      {value}
    </span>
  );
}

/** Whichever comments were left, each labelled with who it was about. */
function Comments({ review }: { review: ReviewRow }) {
  const both = review.vendorComment && review.riderComment;

  if (!review.vendorComment && !review.riderComment) {
    return <span className="text-text-muted">No comment</span>;
  }

  return (
    <span className="flex flex-col gap-1">
      {review.vendorComment && (
        <span>
          {both && <span className="mr-1 text-xs text-text-muted">Food:</span>}
          {review.vendorComment}
        </span>
      )}
      {review.riderComment && (
        <span>
          {both && <span className="mr-1 text-xs text-text-muted">Rider:</span>}
          {review.riderComment}
        </span>
      )}
      {review.replyBody && (
        <span className="text-xs text-text-muted">Vendor replied: {review.replyBody}</span>
      )}
    </span>
  );
}
