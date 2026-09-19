import type { AdminOrderDto } from "../types/api";
import type {
  DeliveryOfferStatus,
  OrderStatus,
  OrderType,
  ParcelSize,
  ParcelStopStatus,
  PaymentMethod,
  PaymentStatus,
  VehicleTypeSlug,
} from "../types/enums";
import { toDate, toDateOrEpoch } from "./dates";

/** One row in the orders table. */
export type OrderRow = {
  id: number;
  orderNumber: string;
  type: OrderType;
  typeLabel: string;
  isParcel: boolean;
  status: OrderStatus;
  statusLabel: string;
  customerName: string;
  vendorName: string | null;
  address: string;
  recipientName: string;
  /** Whoever is carrying it, or null while nobody has accepted. */
  riderName: string | null;
  riderPhone: string | null;
  total: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  needsRefund: boolean;
  /**
   * How this order's money was split. Absent on an older backend, so every
   * reader has to tolerate null rather than render a confident zero.
   */
  earnings: OrderEarnings | null;
  pricing: OrderPricing | null;
  placedAt: Date;
};

/**
 * How the delivery fee was arrived at.
 *
 * Absent on an older backend, so every reader tolerates null rather than
 * rendering a confident zero.
 */
export type OrderPricing = {
  distanceKm: number;
  durationMinutes: number | null;
  baseFee: number;
  freeKm: number;
  perKm: number;
  chargeableKm: number;
  distanceCharge: number;
  vendorPercent: number;
  riderPercent: number;
  serviceFeePercent: number;
  serviceFeeFlat: number;
  settingsName: string;
  /** False on orders placed before the rates were versioned. */
  settingsRecorded: boolean;
};

/** vendor + rider + platform = total. The platform's share is the remainder. */
/**
 * Where an order's money went.
 *
 * null means "not settled yet", which is a different statement from zero. The
 * vendor's share settles when the customer pays; the rider's when somebody
 * delivers. Treating the two as interchangeable is what made the split panel
 * report a confident GHS 0.00 for money that had simply not moved yet.
 */
export type OrderEarnings = {
  vendor: number | null;
  vendorCommission: number | null;
  rider: number | null;
  riderCommission: number | null;
  platform: number | null;
  /** total − vendor − rider. Null until the rider has been paid. */
  platformKeeps: number | null;
  serviceFee: number;
  /** Which published settings priced it; null on orders that predate them. */
  commissionSettingId: number | null;
  vendorSettled: boolean;
  riderSettled: boolean;
};

export type OrderTimelineStep = { status: OrderStatus; label: string; at: Date | null };

export type OrderItemLine = {
  id: number;
  name: string;
  categoryName: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  notes: string | null;
  options: { groupName: string; name: string; additionalPrice: number }[];
};

export type PaymentAttemptRow = {
  reference: string;
  provider: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  statusLabel: string;
  paidAt: Date | null;
  createdAt: Date | null;
};

/** The orders detail page — everything the list row has, plus the nested blocks. */
export type OrderDetail = OrderRow & {
  /** Drives the status control, so an illegal transition cannot be offered. */
  allowedTransitions: { value: OrderStatus; label: string }[];
  customerEmail: string | null;
  customerPhone: string | null;
  customerId: number | null;
  vendorId: number | null;
  vendorPhone: string | null;
  recipientPhone: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  notes: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  items: OrderItemLine[];
  timeline: OrderTimelineStep[];
  attempts: PaymentAttemptRow[];
  /** Who is carrying it, once a rider has accepted. */
  rider: OrderRider | null;
  /** Where the job is in the broadcast, and who was asked. */
  dispatch: OrderDispatch;
  proofOfDelivery: { photoUrl: string | null; deliveredToName: string | null };
  /** Present only on a parcel: what is being carried and where from. */
  parcel: ParcelDetail | null;
  /** Every drop on a parcel run, in the order the rider visits them. */
  stops: ParcelStopRow[];
  /** Both ends of the journey, for the tracking map. */
  pickup: OrderPickup | null;
  dropoffLatitude: number | null;
  dropoffLongitude: number | null;
  /**
   * What happened at the door. `failedAt` set with the order still live is a
   * delivery the rider waited out and abandoned, which is the one state on this
   * screen that is somebody's job rather than a fact.
   */
  arrival: OrderArrival;
  /** What has gone back, and what a refund could still send. */
  refund: OrderRefundState;
  updatedAt: Date | null;
};

export type OrderArrival = {
  arrivedAt: Date | null;
  waitExpiresAt: Date | null;
  distanceMetres: number | null;
  verified: boolean;
  failedAt: Date | null;
  failureReason: string | null;
  needsResolution: boolean;
};

export type OrderRefundState = {
  refunded: number;
  refundableRemaining: number;
  paidFromWallet: number;
  isRefundable: boolean;
  presets: Array<{ key: string; label: string; amount: number }>;
};

export type ParcelStopRow = {
  id: number;
  sequence: number;
  address: string;
  recipientName: string | null;
  recipientPhone: string | null;
  instructions: string | null;
  summary: string;
  itemDescription: string;
  sizeLabel: string | null;
  quantity: number;
  isFragile: boolean;
  weightKg: number | null;
  status: ParcelStopStatus;
  statusLabel: string;
  isOpen: boolean;
  deliveredAt: Date | null;
  deliveredToName: string | null;
  failureReason: string | null;
  photoUrls: string[];
};

export type ParcelDetail = {
  size: ParcelSize;
  sizeLabel: string;
  isFragile: boolean;
  itemDescription: string;
  quantity: number;
  declaredValue: number | null;
  pickupAddress: string;
  pickupContactName: string | null;
  pickupContactPhone: string | null;
  pickupInstructions: string | null;
  deliveryInstructions: string | null;
  stopCount: number;
  totalWeightKg: number | null;
};

export type OrderRider = {
  userId: number;
  riderId: number | null;
  name: string | null;
  phone: string;
  photoUrl: string | null;
  vehicleType: VehicleTypeSlug | null;
  vehicleTypeLabel: string | null;
  plateNumber: string | null;
  latitude: number | null;
  longitude: number | null;
  locationUpdatedAt: Date | null;
};

export type OrderPickup = {
  name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type OrderDispatch = {
  assignedAt: Date | null;
  arrivedAtPickup: Date | null;
  pickedUpAt: Date | null;
  /** Set when every ring came back empty. This is the dispatch queue. */
  needsManualDispatchAt: Date | null;
  offers: DeliveryOfferRow[];
};

export type DeliveryOfferRow = {
  id: number;
  status: DeliveryOfferStatus;
  statusLabel: string;
  round: number;
  earning: number;
  currency: string;
  distanceMeters: number;
  offeredAt: Date | null;
  expiresAt: Date | null;
  respondedAt: Date | null;
};

export function toOrderRow(dto: AdminOrderDto): OrderRow {
  return {
    id: dto.id,
    orderNumber: dto.order_number,
    // Defaulted rather than required: an older backend does not send it, and
    // every existing order was food.
    type: dto.type ?? "food",
    typeLabel: dto.type_label ?? "Food",
    isParcel: dto.is_parcel ?? false,
    status: dto.status,
    statusLabel: dto.status_label,
    customerName: dto.customer?.name ?? dto.delivery.recipient_name,
    vendorName: dto.vendor?.name ?? null,
    address: dto.delivery.address,
    recipientName: dto.delivery.recipient_name,
    riderName: dto.rider?.name ?? null,
    riderPhone: dto.rider?.phone ?? null,
    total: dto.totals.total,
    currency: dto.totals.currency,
    paymentStatus: dto.payment.status,
    paymentMethod: dto.payment.method,
    isPaid: dto.payment.is_paid,
    needsRefund: dto.payment.needs_refund,
    earnings: dto.earnings
      ? {
          vendor: dto.earnings.vendor,
          vendorCommission: dto.earnings.vendor_commission ?? null,
          rider: dto.earnings.rider,
          riderCommission: dto.earnings.rider_commission ?? null,
          platform: dto.earnings.platform,
          platformKeeps: dto.earnings.platform_keeps ?? null,
          serviceFee: dto.earnings.service_fee,
          commissionSettingId: dto.earnings.commission_setting_id,
          vendorSettled: dto.earnings.vendor_settled ?? false,
          riderSettled: dto.earnings.rider_settled ?? false,
        }
      : null,
    pricing: dto.pricing
      ? {
          distanceKm: dto.pricing.distance_km,
          durationMinutes: dto.pricing.duration_minutes,
          baseFee: dto.pricing.base_fee,
          freeKm: dto.pricing.free_km,
          perKm: dto.pricing.per_km,
          chargeableKm: dto.pricing.chargeable_km,
          distanceCharge: dto.pricing.distance_charge,
          vendorPercent: dto.pricing.vendor_percent,
          riderPercent: dto.pricing.rider_percent,
          serviceFeePercent: dto.pricing.service_fee_percent,
          serviceFeeFlat: dto.pricing.service_fee_flat,
          settingsName: dto.pricing.settings_name,
          settingsRecorded: dto.pricing.settings_recorded,
        }
      : null,
    placedAt: toDateOrEpoch(dto.created_at),
  };
}

export function toOrderDetail(dto: AdminOrderDto): OrderDetail {
  return {
    ...toOrderRow(dto),
    allowedTransitions: dto.allowed_transitions,
    customerId: dto.customer?.id ?? null,
    customerEmail: dto.customer?.email ?? null,
    customerPhone: dto.customer?.phone ?? null,
    vendorId: dto.vendor?.id ?? null,
    vendorPhone: dto.vendor?.phone ?? null,
    recipientPhone: dto.delivery.recipient_phone,
    subtotal: dto.totals.subtotal,
    deliveryFee: dto.totals.delivery_fee,
    serviceFee: dto.totals.service_fee ?? 0,
    discount: dto.totals.discount,
    notes: dto.notes,
    rejectionReason: dto.rejection_reason,
    cancellationReason: dto.cancellation_reason,
    items: (dto.items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      categoryName: item.category_name,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      lineTotal: item.line_total,
      notes: item.notes,
      options: (item.options ?? []).map((option) => ({
        groupName: option.group_name,
        name: option.name,
        additionalPrice: option.additional_price,
      })),
    })),
    timeline: dto.timeline.map((step) => ({
      status: step.status,
      label: step.label,
      at: toDate(step.at),
    })),
    rider: dto.rider
      ? {
          userId: dto.rider.id,
          riderId: dto.rider.rider_id,
          name: dto.rider.name,
          phone: dto.rider.phone,
          photoUrl: dto.rider.photo_url,
          vehicleType: dto.rider.vehicle_type,
          vehicleTypeLabel: dto.rider.vehicle_type_label,
          plateNumber: dto.rider.plate_number,
          latitude: dto.rider.latitude ?? null,
          longitude: dto.rider.longitude ?? null,
          locationUpdatedAt: toDate(dto.rider.location_updated_at),
        }
      : null,
    pickup: dto.pickup ?? null,
    dropoffLatitude: dto.delivery.latitude ?? null,
    dropoffLongitude: dto.delivery.longitude ?? null,
    arrival: {
      arrivedAt: toDate(dto.arrival?.arrived_at),
      waitExpiresAt: toDate(dto.arrival?.wait_expires_at),
      distanceMetres: dto.arrival?.distance_metres ?? null,
      verified: dto.arrival?.verified ?? false,
      failedAt: toDate(dto.arrival?.failed_at),
      failureReason: dto.arrival?.failure_reason ?? null,
      needsResolution: dto.arrival?.needs_resolution ?? false,
    },
    refund: {
      refunded: dto.refund?.refunded ?? 0,
      // Falls back to the total against a backend that predates the block, so
      // a full refund is still offered rather than nothing being offered.
      refundableRemaining: dto.refund?.refundable_remaining ?? dto.totals.total,
      paidFromWallet: dto.refund?.paid_from_wallet ?? 0,
      isRefundable: dto.refund?.is_refundable ?? dto.payment.is_paid,
      presets: dto.refund?.presets ?? [],
    },
    dispatch: {
      assignedAt: toDate(dto.dispatch?.assigned_at),
      arrivedAtPickup: toDate(dto.dispatch?.arrived_at_pickup),
      pickedUpAt: toDate(dto.dispatch?.picked_up_at),
      needsManualDispatchAt: toDate(dto.dispatch?.needs_manual_dispatch_at),
      offers: (dto.dispatch?.offers ?? []).map((offer) => ({
        id: offer.id,
        status: offer.status,
        statusLabel: offer.status_label,
        round: offer.round,
        earning: offer.earning,
        currency: offer.currency,
        distanceMeters: offer.distance_meters,
        offeredAt: toDate(offer.offered_at),
        expiresAt: toDate(offer.expires_at),
        respondedAt: toDate(offer.responded_at),
      })),
    },
    proofOfDelivery: {
      photoUrl: dto.proof_of_delivery?.photo_url ?? null,
      deliveredToName: dto.proof_of_delivery?.delivered_to_name ?? null,
    },
    attempts: (dto.payment.attempts ?? []).map((attempt) => ({
      reference: attempt.reference,
      provider: attempt.provider,
      method: attempt.method,
      amount: attempt.amount,
      currency: attempt.currency,
      status: attempt.status,
      statusLabel: attempt.status_label,
      paidAt: toDate(attempt.paid_at),
      createdAt: toDate(attempt.created_at),
    })),
    parcel: dto.parcel
      ? {
          size: dto.parcel.size,
          sizeLabel: dto.parcel.size_label,
          isFragile: dto.parcel.is_fragile,
          itemDescription: dto.parcel.item_description,
          quantity: dto.parcel.quantity,
          declaredValue: dto.parcel.declared_value,
          pickupAddress: dto.parcel.pickup_address,
          pickupContactName: dto.parcel.pickup_contact_name,
          pickupContactPhone: dto.parcel.pickup_contact_phone,
          pickupInstructions: dto.parcel.pickup_instructions,
          deliveryInstructions: dto.parcel.delivery_instructions,
          stopCount: dto.parcel.stop_count ?? 1,
          totalWeightKg: dto.parcel.total_weight_kg ?? null,
        }
      : null,
    stops: (dto.stops ?? []).map((stop) => ({
      id: stop.id,
      sequence: stop.sequence,
      address: stop.address,
      recipientName: stop.recipient_name,
      recipientPhone: stop.recipient_phone,
      instructions: stop.instructions,
      summary: stop.summary,
      itemDescription: stop.item_description,
      sizeLabel: stop.size_label,
      quantity: stop.quantity,
      isFragile: stop.is_fragile,
      weightKg: stop.weight_kg,
      status: stop.status,
      statusLabel: stop.status_label,
      isOpen: stop.is_open,
      deliveredAt: toDate(stop.delivered_at),
      deliveredToName: stop.delivered_to_name,
      failureReason: stop.failure_reason,
      photoUrls: (stop.photos ?? []).map((photo) => photo.url).filter((url): url is string => Boolean(url)),
    })),
    updatedAt: toDate(dto.updated_at),
  };
}
