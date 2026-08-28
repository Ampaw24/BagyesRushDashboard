import type { RiderDto, RiderListDto, RiderPayoutDto } from "../types/api";
import {
  RIDER_DOCUMENT_TYPES,
  type IdentityDocumentType,
  type RiderDocumentType,
  type RiderStatus,
  type VehicleOwnership,
  type VehicleType,
} from "../types/enums";
import { toDate, toDateOrEpoch } from "./dates";

/**
 * The sidebar sub-pages are not four statuses — they are four *situations*, and
 * two of them combine `status` with another flag. Collapsing them here keeps
 * that rule in one place rather than in every badge.
 *
 *  - deleted:    soft-deleted, restorable
 *  - incomplete: registered and never finished onboarding, so there is nothing
 *                to review yet — a follow-up list, not a work queue
 *  - pending:    complete and waiting on a decision
 */
export type RiderDerivedState =
  | "deleted"
  | "incomplete"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export type RiderRow = {
  id: number;
  /** The user account id — what assign-rider takes, not `id`. */
  userId: number;
  riderCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  city: string | null;
  vehicleType: VehicleType | null;
  vehicleTypeLabel: string | null;
  plateNumber: string | null;
  status: RiderStatus;
  statusLabel: string;
  derivedState: RiderDerivedState;
  isActive: boolean;
  isOnline: boolean;
  isProfileComplete: boolean;
  documentsStatus: string | null;
  hasAllDocuments: boolean;
  /** What the rider is owed right now. Zero when they have no wallet yet. */
  walletBalance: number;
  lifetimeEarned: number;
  rating: number;
  reviewCount: number;
  deliveriesCompleted: number;
  lastOnlineAt: Date | null;
  approvedAt: Date | null;
  joinedAt: Date;
  deletedAt: Date | null;
};

function derivedState(input: {
  status: RiderStatus;
  is_profile_complete: boolean;
  deleted_at: string | null;
}): RiderDerivedState {
  if (input.deleted_at) return "deleted";
  if (input.status === "pending_review" && !input.is_profile_complete) return "incomplete";
  if (input.status === "pending_review") return "pending";
  return input.status === "approved" ? "approved" : input.status;
}

export function toRiderRow(dto: RiderListDto): RiderRow {
  return {
    id: dto.id,
    userId: dto.user_id,
    riderCode: dto.rider_code,
    name: dto.name,
    phone: dto.phone ?? null,
    email: dto.email ?? null,
    photoUrl: dto.photo_url,
    city: dto.city,
    vehicleType: dto.vehicle_type,
    vehicleTypeLabel: dto.vehicle_type_label,
    plateNumber: dto.plate_number,
    status: dto.status,
    statusLabel: dto.status_label,
    derivedState: derivedState(dto),
    isActive: dto.is_active,
    isOnline: dto.is_online,
    isProfileComplete: dto.is_profile_complete,
    documentsStatus: dto.documents_status,
    hasAllDocuments: dto.has_all_documents,
    walletBalance: dto.wallet?.balance ?? 0,
    lifetimeEarned: dto.wallet?.lifetime_earned ?? 0,
    rating: dto.rating,
    reviewCount: dto.review_count,
    deliveriesCompleted: dto.deliveries_completed,
    lastOnlineAt: toDate(dto.last_online_at),
    approvedAt: toDate(dto.approved_at),
    joinedAt: toDateOrEpoch(dto.created_at),
    deletedAt: toDate(dto.deleted_at),
  };
}

export type RiderDocument = {
  type: RiderDocumentType;
  uploaded: boolean;
  /** A bicycle courier is not asked for a licence, insurance or roadworthy. */
  required: boolean;
};

export type RiderDetail = RiderRow & {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  residentialAddress: string | null;
  identity: {
    type: IdentityDocumentType | null;
    typeLabel: string | null;
    number: string | null;
  };
  vehicle: {
    make: string | null;
    model: string | null;
    colour: string | null;
    year: number | null;
    ownership: VehicleOwnership | null;
    ownershipLabel: string | null;
  };
  licence: {
    number: string | null;
    class: string | null;
    expiresAt: Date | null;
    permitNumber: string | null;
    permitExpiresAt: Date | null;
  };
  insurance: {
    provider: string | null;
    policyNumber: string | null;
    expiresAt: Date | null;
    roadworthyExpiresAt: Date | null;
  };
  /** Column name -> date. Expired is why a rider cannot go online. */
  credentials: {
    expired: { field: string; on: Date }[];
    expiringSoon: { field: string; on: Date }[];
  };
  availability: {
    operatingAreas: string[];
    operatingDays: string[];
    shiftStartTime: string | null;
    shiftEndTime: string | null;
  };
  consent: {
    termsAcceptedAt: Date | null;
    termsVersion: string | null;
    dataConsentAt: Date | null;
    isComplete: boolean;
    currentTermsVersion: string | null;
    /** Agreed, but to a version that has since been replaced. */
    isOutdated: boolean;
  };
  emergencyContact: {
    name: string | null;
    phone: string | null;
    relationship: string | null;
  };
  rejectionReason: string | null;
  missingProfileFields: string[];
  canGoOnline: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  locationUpdatedAt: Date | null;
  maxDeliveryRadiusKm: number;
  maxConcurrentJobs: number;
  documents: RiderDocument[];
  documentsReviewedAt: Date | null;
  payoutConfigured: boolean;
  payoutMasked: {
    bankName: string | null;
    accountName: string | null;
    accountNumberLast4: string | null;
    momoProviderName: string | null;
    mobileMoneyNumberLast4: string | null;
  };
  updatedAt: Date | null;
};

export function toRiderDetail(dto: RiderDto): RiderDetail {
  return {
    id: dto.id,
    // RiderProfileResource does not carry the user id; nothing on the detail
    // page assigns an order, so it is not needed here.
    userId: 0,
    // The detail page reads the balance from the wallet endpoint, which carries
    // the full ledger — these are only here to satisfy the shared row shape.
    walletBalance: 0,
    lifetimeEarned: 0,
    riderCode: dto.rider_code,
    name: dto.name,
    firstName: dto.first_name,
    lastName: dto.last_name,
    phone: dto.phone ?? null,
    email: dto.email ?? null,
    photoUrl: dto.profile_photo_url,
    city: dto.city,
    dateOfBirth: toDate(dto.date_of_birth),
    residentialAddress: dto.residential_address,

    identity: {
      type: dto.identity?.type ?? null,
      typeLabel: dto.identity?.type_label ?? null,
      number: dto.identity?.number ?? null,
    },

    vehicleType: dto.vehicle.type,
    vehicleTypeLabel: dto.vehicle.type_label,
    plateNumber: dto.vehicle.plate_number,
    vehicle: {
      make: dto.vehicle.make,
      model: dto.vehicle.model,
      colour: dto.vehicle.colour,
      year: dto.vehicle.year,
      ownership: dto.vehicle.ownership ?? null,
      ownershipLabel: dto.vehicle.ownership_label ?? null,
    },

    licence: {
      number: dto.licence?.number ?? null,
      class: dto.licence?.class ?? null,
      expiresAt: toDate(dto.licence?.expires_at),
      permitNumber: dto.licence?.permit_number ?? null,
      permitExpiresAt: toDate(dto.licence?.permit_expires_at),
    },

    insurance: {
      provider: dto.insurance?.provider ?? null,
      policyNumber: dto.insurance?.policy_number ?? null,
      expiresAt: toDate(dto.insurance?.expires_at),
      roadworthyExpiresAt: toDate(dto.insurance?.roadworthy_expires_at),
    },

    credentials: {
      expired: toCredentialList(dto.credentials?.expired),
      expiringSoon: toCredentialList(dto.credentials?.expiring_soon),
    },

    availability: {
      operatingAreas: dto.availability?.operating_areas ?? [],
      operatingDays: dto.availability?.operating_days ?? [],
      shiftStartTime: dto.availability?.shift_start_time ?? null,
      shiftEndTime: dto.availability?.shift_end_time ?? null,
    },

    consent: {
      termsAcceptedAt: toDate(dto.consent?.terms_accepted_at),
      termsVersion: dto.consent?.terms_version ?? null,
      dataConsentAt: toDate(dto.consent?.data_consent_at),
      isComplete: dto.consent?.is_complete ?? false,
      currentTermsVersion: dto.consent?.current_terms_version ?? null,
      isOutdated:
        (dto.consent?.is_complete ?? false) &&
        dto.consent?.terms_version !== dto.consent?.current_terms_version,
    },

    emergencyContact: {
      name: dto.emergency_contact.name,
      phone: dto.emergency_contact.phone,
      relationship: dto.emergency_contact.relationship ?? null,
    },

    status: dto.status,
    statusLabel: dto.status_label,
    // A detail response carries no deleted_at, so a rider opened from the
    // Deleted list still reads by their real status here.
    derivedState: derivedState({ ...dto, deleted_at: null }),
    isActive: dto.is_active,
    isOnline: dto.is_online,
    isProfileComplete: dto.is_profile_complete,
    rejectionReason: dto.rejection_reason,
    missingProfileFields: dto.missing_profile_fields,
    canGoOnline: dto.can_go_online,

    currentLatitude: dto.current_latitude,
    currentLongitude: dto.current_longitude,
    locationUpdatedAt: toDate(dto.location_updated_at),
    maxDeliveryRadiusKm: dto.max_delivery_radius_km,
    maxConcurrentJobs: dto.max_concurrent_jobs,

    rating: dto.rating,
    reviewCount: dto.review_count,
    deliveriesCompleted: dto.deliveries_completed,

    documentsStatus: dto.documents_status,
    hasAllDocuments: RIDER_DOCUMENT_TYPES.every(
      (type) => !dto.documents[type]?.required || dto.documents[type]?.uploaded,
    ),
    documents: RIDER_DOCUMENT_TYPES.map((type) => ({
      type,
      uploaded: dto.documents[type]?.uploaded ?? false,
      required: dto.documents[type]?.required ?? false,
    })),
    documentsReviewedAt: toDate(dto.documents_reviewed_at),

    payoutConfigured: dto.payout.is_configured,
    payoutMasked: {
      bankName: dto.payout.bank?.name ?? null,
      accountName: dto.payout.account_name,
      accountNumberLast4: dto.payout.account_number_last4,
      momoProviderName: dto.payout.momo_provider?.name ?? null,
      mobileMoneyNumberLast4: dto.payout.mobile_money_number_last4,
    },

    lastOnlineAt: toDate(dto.last_online_at),
    approvedAt: toDate(dto.approved_at),
    joinedAt: toDateOrEpoch(dto.created_at),
    // RiderProfileResource carries no deleted_at - a rider opened from the
    // Deleted list still reads by their real status here.
    deletedAt: null,
    updatedAt: toDate(dto.updated_at),
  };
}

/**
 * The API keys expiries by column name; the UI wants a list it can order.
 */
function toCredentialList(input: Record<string, string> | undefined): { field: string; on: Date }[] {
  return Object.entries(input ?? {})
    .map(([field, on]) => ({ field, on: new Date(on) }))
    .filter((entry) => !Number.isNaN(entry.on.getTime()))
    .sort((a, b) => a.on.getTime() - b.on.getTime());
}

/** Masked payout details, from the separately-permissioned endpoint. */
export type RiderPayout = {
  bankName: string | null;
  accountName: string | null;
  accountNumberLast4: string | null;
  momoProviderName: string | null;
  mobileMoneyNumberLast4: string | null;
  isConfigured: boolean;
};

export function toRiderPayout(dto: RiderPayoutDto): RiderPayout {
  return {
    bankName: dto.bank_name,
    accountName: dto.account_name,
    accountNumberLast4: dto.account_number_last4,
    momoProviderName: dto.momo_provider_name,
    mobileMoneyNumberLast4: dto.mobile_money_number_last4,
    isConfigured: dto.is_configured,
  };
}
