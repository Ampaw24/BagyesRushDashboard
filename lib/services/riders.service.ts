import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type {
  CreatedRiderDto,
  RiderDto,
  RiderListDto,
  RiderLiveDto,
  RiderPayoutDto,
  RiderStatsDto,
} from "../types/api";
import type { IdentityDocumentType, RiderStatus } from "../types/enums";

export type RiderListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: RiderStatus;
  /**
   * Any type, not only the active ones: a rider registered before a vehicle was
   * retired still has to be findable.
   */
  vehicle_type_id?: number;
  city?: string;
  is_online?: boolean;
  is_active?: boolean;
  /** False lists people who started onboarding and stopped. */
  is_profile_complete?: boolean;
  /**
   * Paperwork that has run out, or is about to.
   *
   * `expired` is why a rider cannot go online today — `canGoOnline()` refuses
   * them and says nothing to anybody. `expiring` is the renewal list, inside
   * the platform's warning window. The backend asks the looser question in SQL
   * so the list can paginate, then decides per rider which documents that
   * rider actually needs — so a bicycle courier never appears for a licence.
   */
  credential_state?: "expired" | "expiring";
  with_trashed?: boolean;
};

/**
 * GET /admin/riders — requires `riders.view`.
 *
 * Applications awaiting a decision are returned first: this list is a work
 * queue before it is a directory.
 */
export async function listRiders(query: RiderListQuery): Promise<Paginated<RiderListDto>> {
  return apiFetchPage<RiderListDto>("/admin/riders", { query });
}

/** GET /admin/riders/stats — requires `riders.view`. */
export async function getRiderStats(): Promise<RiderStatsDto> {
  return apiFetch<RiderStatsDto>("/admin/riders/stats");
}

/** GET /admin/riders/{id} — requires `riders.view`. */
export async function getRider(id: number): Promise<RiderDto> {
  return apiFetch<RiderDto>(`/admin/riders/${id}`);
}

/**
 * GET /admin/riders/live — requires `riders.view`.
 *
 * The dispatch map's first paint only. Everything after it arrives on the
 * `admin.riders` websocket channel, so this is not a polling endpoint — call it
 * once and let the socket take over.
 *
 * Riders with no fix at all are excluded by the backend (there is nowhere to
 * put the marker); ones whose fix has gone stale are returned with `is_stale`
 * set, because "last seen here twenty minutes ago" is how a dispatcher notices
 * a phone that has died.
 */
export async function listLiveRiders(includeOffline = false): Promise<RiderLiveDto[]> {
  return apiFetch<RiderLiveDto[]>("/admin/riders/live", {
    query: includeOffline ? { include_offline: true } : {},
  });
}

export type CreateRiderInput = {
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  city: string;
  /** From GET /admin/vehicle-types. Only an active type may be registered. */
  vehicle_type_id: number;
  /** Required when the chosen type has `requires_plate`. */
  plate_number?: string | null;
  date_of_birth?: string | null;
  /**
   * `id_type` + `id_number`, matching CreateRiderRequest. This was typed as a
   * single `ghana_card_number`, which the backend has never accepted — a
   * passport holder has no Ghana Card, so the document type is part of the
   * answer rather than assumed.
   */
  id_type?: IdentityDocumentType | string | null;
  id_number?: string | null;
  residential_address?: string | null;
  /** Must belong to `vehicle_type_id`; the model must belong to the make. */
  vehicle_make_id?: number | null;
  vehicle_model_id?: number | null;
  vehicle_colour?: string | null;
  vehicle_year?: number | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};

/**
 * POST /admin/riders — requires `riders.create`.
 *
 * The generated password comes back exactly once, to be handed over. It is not
 * recoverable afterwards.
 */
export async function createRider(input: CreateRiderInput): Promise<CreatedRiderDto> {
  return apiFetch<CreatedRiderDto>("/admin/riders", { method: "POST", body: input });
}

/** PUT /admin/riders/{id} — requires `riders.update`. */
export async function updateRider(id: number, input: Partial<CreateRiderInput>): Promise<RiderDto> {
  return apiFetch<RiderDto>(`/admin/riders/${id}`, { method: "PUT", body: input });
}

/**
 * PATCH /admin/riders/{id}/availability — requires `riders.update`.
 *
 * Carries the same guards the rider own switch does: going online is refused
 * unless they are cleared to work, and going offline is refused while they are
 * carrying a delivery. Reassign the order first.
 */
export async function setRiderAvailability(id: number, isOnline: boolean): Promise<RiderDto> {
  return apiFetch<RiderDto>(`/admin/riders/${id}/availability`, {
    method: "PATCH",
    body: { is_online: isOnline },
  });
}

/** DELETE /admin/riders/{id} — refused while the rider is mid-delivery. */
export async function deleteRider(id: number): Promise<null> {
  return apiFetch<null>(`/admin/riders/${id}`, { method: "DELETE" });
}

export async function restoreRider(id: number): Promise<RiderDto> {
  return apiFetch<RiderDto>(`/admin/riders/${id}/restore`, { method: "POST" });
}

/**
 * PATCH /admin/riders/{id}/status — requires `riders.moderate`.
 *
 * One endpoint for all four outcomes, because RiderAdminService::transition()
 * is the single writer of riders.status whichever is chosen. `reason` is
 * required (10–255 characters) for reject and suspend.
 */
export async function moderateRider(
  id: number,
  action: "approve" | "reject" | "suspend" | "reinstate",
  reason?: string,
): Promise<RiderDto> {
  return apiFetch<RiderDto>(`/admin/riders/${id}/status`, {
    method: "PATCH",
    body: reason ? { action, reason } : { action },
  });
}

/**
 * GET /admin/riders/{id}/payout — requires `riders.payout`, which is separate
 * from `riders.update` on purpose. Every read is recorded in the audit log.
 */
export async function getRiderPayout(id: number): Promise<RiderPayoutDto> {
  return apiFetch<RiderPayoutDto>(`/admin/riders/${id}/payout`);
}
