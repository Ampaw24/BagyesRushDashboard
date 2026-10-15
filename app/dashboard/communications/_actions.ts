"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  cancelCommunication,
  composeCommunication,
  createCommunicationTemplate,
  deleteCommunicationTemplate,
  getCommunication,
  listCommunicationRecipients,
  previewAudience,
  searchAudience,
  sendCommunication,
  sendTestPush,
  updateCommunicationTemplate,
  type AudiencePreviewInput,
  type ComposeCommunicationInput,
  type TemplateInput,
} from "@/lib/services/communications.service";
import {
  toAudiencePreview,
  toCommunicationRecipientRow,
  toCommunicationRow,
  type AudiencePreview,
  type CommunicationRecipientRow,
  type CommunicationRow,
} from "@/lib/mappers/communication.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import type { PaginationMeta } from "@/lib/api/types";
import type { AudienceCandidateDto } from "@/lib/types/api";

export type CommunicationQuickView = {
  communication: CommunicationRow;
  recipients: CommunicationRecipientRow[];
  pagination: PaginationMeta;
  /** `communications.send` — sending spends credits, so it is its own right. */
  canSend: boolean;
};

/**
 * One broadcast and a page of its recipients, for the quick-view dialog.
 *
 * The dialog pages through recipients in place, so this takes a page rather
 * than reading it off the URL the way the full page does.
 */
export async function loadCommunicationQuickViewAction(id: number, page = 1) {
  return apiAction<CommunicationQuickView>("Communication retrieved", async () => {
    const [permissions, communication, recipients] = await Promise.all([
      getPermissions(),
      getCommunication(id),
      listCommunicationRecipients(id, { page, per_page: 15 }),
    ]);

    return {
      communication: toCommunicationRow(communication),
      recipients: recipients.items.map(toCommunicationRecipientRow),
      pagination: recipients.pagination,
      canSend: can(permissions, "communications.send"),
    };
  });
}

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

/**
 * Send one push and hand back exactly what Firebase said.
 *
 * A diagnostic, not a feature: Firebase counts a message as delivered the
 * moment FCM accepts it, so its console cannot distinguish a handset that
 * rendered a notification from one that did nothing with it. Nothing is
 * revalidated because nothing is stored.
 */
export async function sendTestPushAction(input: {
  token?: string;
  user_id?: number;
  title?: string;
  body?: string;
  mode?: "notification" | "data" | "both";
}) {
  return apiAction("Test push dispatched", async () => sendTestPush(input));
}
