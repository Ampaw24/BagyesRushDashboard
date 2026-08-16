import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { ReviewDto } from "../types/api";

export type ReviewListQuery = {
  page?: number;
  per_page?: number;
  rating?: number;
  is_visible?: boolean;
  vendor_id?: number;
};

/**
 * Review moderation. Listing needs `reviews.view`; hiding and deleting need
 * `reviews.moderate`.
 *
 * Note: ListReviewsRequest also accepts `with_comment` and `unanswered`, but
 * ReviewService::paginateForAdmin() ignores both — so they are deliberately not
 * exposed here rather than shipping filters that quietly do nothing.
 */
export async function listReviews(query: ReviewListQuery): Promise<Paginated<ReviewDto>> {
  return apiFetchPage<ReviewDto>("/admin/reviews", { query });
}

export async function getReview(id: number): Promise<ReviewDto> {
  return apiFetch<ReviewDto>(`/admin/reviews/${id}`);
}

/** Hides or restores a review on the storefront. Requires `reviews.moderate`. */
export async function toggleReviewVisibility(id: number): Promise<ReviewDto> {
  return apiFetch<ReviewDto>(`/admin/reviews/${id}/toggle-visibility`, { method: "PATCH" });
}

export async function deleteReview(id: number): Promise<null> {
  return apiFetch<null>(`/admin/reviews/${id}`, { method: "DELETE" });
}
