import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type {
  AudienceCandidateDto,
  AudiencePreviewDto,
  CommunicationAudienceFilters,
  CommunicationDto,
  CommunicationOptionsDto,
  CommunicationRecipientDto,
  CommunicationTemplateDto,
  TestPushResultDto,
} from "../types/api";
import type { CommunicationAudience, CommunicationChannel, CommunicationStatus } from "../types/enums";

export type CommunicationListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: CommunicationStatus;
  channel?: CommunicationChannel;
};

/** GET /admin/communications — requires `communications.view`. */
export async function listCommunications(
  query: CommunicationListQuery,
): Promise<Paginated<CommunicationDto>> {
  return apiFetchPage<CommunicationDto>("/admin/communications", { query });
}

/** GET /admin/communications/{id} — requires `communications.view`. */
export async function getCommunication(id: number): Promise<CommunicationDto> {
  return apiFetch<CommunicationDto>(`/admin/communications/${id}`);
}

/** The composer vocabulary, read from the backend enums so the two cannot drift. */
export async function getCommunicationOptions(): Promise<CommunicationOptionsDto> {
  return apiFetch<CommunicationOptionsDto>("/admin/communications/options");
}

/**
 * GET /admin/communications/{id}/recipients — the per-person audit trail.
 *
 * This is what makes a send answerable: a counter says "9,842 sent", this says
 * whether it reached that particular vendor.
 */
export async function listCommunicationRecipients(
  id: number,
  query: { page?: number; per_page?: number; status?: string } = {},
): Promise<Paginated<CommunicationRecipientDto>> {
  return apiFetchPage<CommunicationRecipientDto>(`/admin/communications/${id}/recipients`, { query });
}

export type AudiencePreviewInput = {
  audience: CommunicationAudience;
  audience_filters?: CommunicationAudienceFilters;
};

/**
 * POST /admin/communications/preview — requires `communications.send`.
 *
 * Its own call because SMS is billed per segment: an admin about to text nine
 * thousand people should see that number before they spend it.
 */
export async function previewAudience(input: AudiencePreviewInput): Promise<AudiencePreviewDto> {
  return apiFetch<AudiencePreviewDto>("/admin/communications/preview", { method: "POST", body: input });
}

export type ComposeCommunicationInput = {
  channel: CommunicationChannel;
  audience: CommunicationAudience;
  audience_filters?: CommunicationAudienceFilters;
  title: string;
  body: string;
  sms_body?: string | null;
  image_url?: string | null;
  /** Send straight away; otherwise a `scheduled_at` schedules it, and neither leaves a draft. */
  send_now?: boolean;
  scheduled_at?: string | null;
};

/** POST /admin/communications — requires `communications.send`. */
export async function composeCommunication(
  input: ComposeCommunicationInput,
): Promise<CommunicationDto> {
  return apiFetch<CommunicationDto>("/admin/communications", { method: "POST", body: input });
}

/** POST /admin/communications/{id}/send — sends a draft, or a scheduled one early. */
export async function sendCommunication(id: number): Promise<CommunicationDto> {
  return apiFetch<CommunicationDto>(`/admin/communications/${id}/send`, { method: "POST" });
}

/** POST /admin/communications/{id}/cancel — refused once a worker has started sending. */
export async function cancelCommunication(id: number): Promise<CommunicationDto> {
  return apiFetch<CommunicationDto>(`/admin/communications/${id}/cancel`, { method: "POST" });
}

// --- Templates --------------------------------------------------------------

export async function listCommunicationTemplates(
  query: { page?: number; per_page?: number; search?: string; is_active?: boolean } = {},
): Promise<Paginated<CommunicationTemplateDto>> {
  return apiFetchPage<CommunicationTemplateDto>("/admin/communications/templates", { query });
}

export type TemplateInput = {
  name: string;
  channel: CommunicationChannel;
  title: string;
  body: string;
  sms_body?: string | null;
  placeholders?: string[];
  is_active?: boolean;
};

export async function createCommunicationTemplate(
  input: TemplateInput,
): Promise<CommunicationTemplateDto> {
  return apiFetch<CommunicationTemplateDto>("/admin/communications/templates", {
    method: "POST",
    body: input,
  });
}

export async function updateCommunicationTemplate(
  id: number,
  input: Partial<TemplateInput>,
): Promise<CommunicationTemplateDto> {
  return apiFetch<CommunicationTemplateDto>(`/admin/communications/templates/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteCommunicationTemplate(id: number): Promise<void> {
  await apiFetch<null>(`/admin/communications/templates/${id}`, { method: "DELETE" });
}

// --- Direct messages --------------------------------------------------------

/**
 * POST /admin/users/{id}/message — requires `communications.send`.
 *
 * Goes through the same machinery as a broadcast so it lands in the same audit
 * trail rather than a second one.
 */
export async function messageUser(
  userId: number,
  input: { channel: CommunicationChannel; title: string; body: string; sms_body?: string | null },
): Promise<CommunicationDto> {
  return apiFetch<CommunicationDto>(`/admin/users/${userId}/message`, { method: "POST", body: input });
}

/**
 * GET /admin/communications/audience/search
 *
 * Backs the "selected people" picker. The custom audience used to take raw user
 * ids, which nobody knows.
 */
export async function searchAudience(
  query: { q?: string; role?: string; limit?: number } = {},
): Promise<{ results: AudienceCandidateDto[] }> {
  return apiFetch<{ results: AudienceCandidateDto[] }>("/admin/communications/audience/search", {
    query,
  });
}

/**
 * POST /admin/push/test — requires `communications.send`.
 *
 * Sends one push and hands back the exact payload and Firebase's raw answer.
 *
 * This exists because Firebase's own console cannot answer the question people
 * actually have. It counts a message as delivered the moment FCM accepts it, so
 * a handset that rendered nothing looks identical to one that did. `mode`
 * isolates the two halves: `notification` is what the Firebase console
 * composes, `data` is what a foregrounded Flutter app receives, and `both` is
 * what this application really sends — so a push that works from the console
 * and not from here can be narrowed to which half.
 *
 * Send to a raw token, or to `user_id` to reach every device that person has
 * registered, whichever the person debugging has to hand.
 */
export async function sendTestPush(input: {
  token?: string;
  user_id?: number;
  title?: string;
  body?: string;
  mode?: "notification" | "data" | "both";
}): Promise<TestPushResultDto> {
  return apiFetch<TestPushResultDto>("/admin/push/test", { method: "POST", body: input });
}
