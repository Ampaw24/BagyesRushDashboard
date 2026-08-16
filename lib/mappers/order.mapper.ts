import type { AdminOrderDto } from "../types/api";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "../types/enums";
import { toDate, toDateOrEpoch } from "./dates";

/** One row in the orders table. */
export type OrderRow = {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  customerName: string;
  vendorName: string | null;
  address: string;
  recipientName: string;
  /**
   * AdminOrderResource carries no rider name — only an id and a phone — so the
   * table shows the phone rather than inventing a name.
   */
  riderPhone: string | null;
  total: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  needsRefund: boolean;
  placedAt: Date;
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
  discount: number;
  notes: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  items: OrderItemLine[];
  timeline: OrderTimelineStep[];
  attempts: PaymentAttemptRow[];
  updatedAt: Date | null;
};

export function toOrderRow(dto: AdminOrderDto): OrderRow {
  return {
    id: dto.id,
    orderNumber: dto.order_number,
    status: dto.status,
    statusLabel: dto.status_label,
    customerName: dto.customer?.name ?? dto.delivery.recipient_name,
    vendorName: dto.vendor?.name ?? null,
    address: dto.delivery.address,
    recipientName: dto.delivery.recipient_name,
    riderPhone: dto.rider?.phone ?? null,
    total: dto.totals.total,
    currency: dto.totals.currency,
    paymentStatus: dto.payment.status,
    paymentMethod: dto.payment.method,
    isPaid: dto.payment.is_paid,
    needsRefund: dto.payment.needs_refund,
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
    updatedAt: toDate(dto.updated_at),
  };
}
