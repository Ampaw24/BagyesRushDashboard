"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import { deleteReview, toggleReviewVisibility } from "@/lib/services/reviews.service";

/** Both require `reviews.moderate`; listing only needs `reviews.view`. */

export async function toggleReviewVisibilityAction(id: number) {
  return apiAction("Review visibility updated", async () => {
    await toggleReviewVisibility(id);
    revalidatePath("/dashboard/reviews");
  });
}

export async function deleteReviewAction(id: number) {
  return apiAction("Review deleted", async () => {
    await deleteReview(id);
    revalidatePath("/dashboard/reviews");
  });
}
