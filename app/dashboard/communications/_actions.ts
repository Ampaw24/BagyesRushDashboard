"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  cancelCommunication,
  composeCommunication,
  createCommunicationTemplate,
  deleteCommunicationTemplate,
  previewAudience,
  searchAudience,
  sendCommunication,
  updateCommunicationTemplate,
  type AudiencePreviewInput,
  type ComposeCommunicationInput,
  type TemplateInput,
} from "@/lib/services/communications.service";
import { toAudiencePreview, type AudiencePreview } from "@/lib/mappers/communication.mapper";
import type { AudienceCandidateDto } from "@/lib/types/api";

/**
 * Broadcasts.
 *
 * The backend permissions are the real gate — `communications.view` to read,
 * `communications.send` to spend credits — and these wrappers only carry the
 * session cookie and normalise the result for the composer.
 */
function revalidateCommunicationViews() {
  revalidatePath("/dashboard/communications");
  revalidatePath("/dashboard/communications/history");
  revalidatePath("/dashboard/communications/scheduled");
}

/**
 * The blast radius, before spending it.
 *
 * Returns the preview rather than a message: the composer renders the number
 * inline, and an admin about to text nine thousand people should see it first.
 */
export async function previewAudienceAction(input: AudiencePreviewInput) {
  return apiAction<AudiencePreview>("", async () => toAudiencePreview(await previewAudience(input)));
}

export async function composeCommunicationAction(input: ComposeCommunicationInput) {
  const message = input.send_now
    ? "Communication sent"
    : input.scheduled_at
      ? "Communication scheduled"
      : "Draft saved";

  return apiAction(message, async () => {
    const communication = await composeCommunication(input);
    revalidateCommunicationViews();

    return communication.id;
  });
}

export async function sendCommunicationAction(id: number) {
  return apiAction("Communication queued for sending", async () => {
    await sendCommunication(id);
    revalidateCommunicationViews();
    revalidatePath(`/dashboard/communications/history/${id}`);
  });
}

/** Refused once a worker has started: some of those people have been reached. */
export async function cancelCommunicationAction(id: number) {
  return apiAction("Communication cancelled", async () => {
    await cancelCommunication(id);
    revalidateCommunicationViews();
    revalidatePath(`/dashboard/communications/history/${id}`);
  });
}

// --- Templates --------------------------------------------------------------

export async function createTemplateAction(input: TemplateInput) {
  return apiAction("Template created", async () => {
    await createCommunicationTemplate(input);
    revalidatePath("/dashboard/communications/templates");
  });
}

export async function updateTemplateAction(id: number, input: Partial<TemplateInput>) {
  return apiAction("Template updated", async () => {
    await updateCommunicationTemplate(id, input);
    revalidatePath("/dashboard/communications/templates");
  });
}

export async function deleteTemplateAction(id: number) {
  return apiAction("Template deleted", async () => {
    await deleteCommunicationTemplate(id);
    revalidatePath("/dashboard/communications/templates");
  });
}

/** Backs the "selected people" picker — the composer needs names, not ids. */
export async function searchAudienceAction(query: { q?: string; role?: string; limit?: number }) {
  return apiAction<AudienceCandidateDto[]>("", async () => (await searchAudience(query)).results);
}
