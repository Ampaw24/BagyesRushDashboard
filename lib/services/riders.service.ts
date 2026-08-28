import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type {
  CreatedRiderDto,
  RiderDto,
  RiderListDto,
  RiderPayoutDto,
  RiderStatsDto,
} from "../types/api";
import type { RiderStatus, VehicleType } from "../types/enums";

export type RiderListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: RiderStatus;
  vehicle_type?: VehicleType;
  city?: string;
  is_online?: boolean;
  is_active?: boolean;
  /** False lists people who started onboarding and stopped. */
  is_profile_complete?: boolean;
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

export type CreateRiderInput = {
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  city: string;
  vehicle_type: VehicleType;
  /** Required for anything but a bicycle. */
  plate_number?: string | null;
  date_of_birth?: string | null;
  ghana_card_number?: string | null;
  residential_address?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
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
