import type { AdminCustomerDto, CustomerDetailDto } from "../types/api";
import type { UserStatus } from "../types/enums";
import { toDate, toDateLoose, toDateOrEpoch } from "./dates";

export type CustomerRow = {
  id: number;
  /**
   * The linked user account, which is what the direct-message endpoint takes —
   * a customer id is not a user id. Null for a customer row with no account
   * behind it, in which case messaging is not offered.
   */
  userId: number | null;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  /**
   * Lives on the linked user account. The mock's third "disabled" state has no
   * backend equivalent — an account is active or suspended.
   */
  status: UserStatus;
  phoneVerified: boolean;
  avatarUrl: string | null;
  referralCode: string | null;
  referralCount: number;
  /** Present on list responses only; the detail endpoint drops it. */
  ordersCount: number | null;
  joinedAt: Date;
};

export type CustomerDetail = CustomerRow & {
  summary: {
    ordersPlaced: number;
    ordersDelivered: number;
    ordersCancelled: number;
    lifetimeValue: number;
    lastOrderedAt: Date | null;
  };
};

export function toCustomerRow(dto: AdminCustomerDto): CustomerRow {
  return {
    id: dto.id,
    userId: dto.account?.id ?? null,
    fullName: dto.full_name,
    firstName: dto.first_name,
    lastName: dto.last_name,
    email: dto.account?.email ?? null,
    phone: dto.account?.phone ?? null,
    // A customer row with no linked account cannot be suspended, so treating a
    // missing account as active matches what the suspend endpoint would say.
    status: dto.account?.status ?? "active",
    phoneVerified: dto.account?.phone_verified ?? false,
    avatarUrl: dto.profile_picture_url,
    referralCode: dto.referral_code,
    referralCount: dto.referral_count,
    ordersCount: dto.orders_count ?? null,
    joinedAt: toDateOrEpoch(dto.account?.joined_at ?? dto.created_at),
  };
}

export function toCustomerDetail(dto: CustomerDetailDto): CustomerDetail {
  return {
    ...toCustomerRow(dto.customer),
    summary: {
      ordersPlaced: dto.summary.orders_placed,
      ordersDelivered: dto.summary.orders_delivered,
      ordersCancelled: dto.summary.orders_cancelled,
      lifetimeValue: dto.summary.lifetime_value,
      // Unlike every other timestamp, this one is a raw DB datetime.
      lastOrderedAt: toDateLoose(dto.summary.last_ordered_at),
    },
  };
}

/** Exported for the rare caller that wants a plain ISO field parsed the same way. */
export { toDate };
