import type { AdminPaymentDto } from "../types/api";
import type { PaymentMethod, PaymentStatus } from "../types/enums";
import { toDate, toDateOrEpoch } from "./dates";

/** One row in the transactions (payments) table. */
export type PaymentRow = {
  id: number;
  reference: string;
  gatewayReference: string | null;
  provider: string;
  method: PaymentMethod | null;
  methodLabel: string;
  status: PaymentStatus;
  statusLabel: string;
  isPaid: boolean;
  amount: number;
  currency: string;
  orderId: number | null;
  orderNumber: string | null;
  vendorName: string | null;
  customerName: string | null;
  paidAt: Date | null;
  createdAt: Date;
};

export function toPaymentRow(dto: AdminPaymentDto): PaymentRow {
  return {
    id: dto.id,
    reference: dto.reference,
    gatewayReference: dto.gateway_reference,
    provider: dto.provider,
    method: dto.method,
    methodLabel: dto.method_label ?? "—",
    status: dto.status,
    statusLabel: dto.status_label,
    isPaid: dto.is_paid,
    amount: dto.amount,
    currency: dto.currency,
    orderId: dto.order?.id ?? null,
    orderNumber: dto.order?.order_number ?? null,
    vendorName: dto.order?.vendor?.name ?? null,
    customerName: dto.order?.customer?.name ?? null,
    paidAt: toDate(dto.paid_at),
    createdAt: toDateOrEpoch(dto.created_at),
  };
}
