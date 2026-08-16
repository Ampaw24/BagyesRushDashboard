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
      <FilterBar searchable={false} filters={[RATING_FILTER, VISIBILITY_FILTER]} />

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
                <TableHeadCell>Rating</TableHeadCell>
                <TableHeadCell>Comment</TableHeadCell>
                <TableHeadCell>Vendor</TableHeadCell>
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
                  <TableCell>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <StarIcon className="h-4 w-4 text-brand" />
                      {review.rating}
                    </span>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {review.comment ?? <span className="text-text-muted">No comment</span>}
                    {review.replyBody && (
                      <span className="mt-1 block text-xs text-text-muted">
                        Vendor replied: {review.replyBody}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {review.vendorId ? (
                      <Link
                        href={`/dashboard/vendors/${review.vendorId}`}
                        className="text-brand transition duration-150 hover:opacity-80"
                      >
                        {review.vendorName}
                      </Link>
                    ) : (
                      "—"
                    )}
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
