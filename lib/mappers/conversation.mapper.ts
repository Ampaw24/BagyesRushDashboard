import type {
  AdminConversationDto,
  AdminConversationParticipantDto,
  AdminMessageDto,
} from "../types/api";
import type { ConversationParticipantRole, ConversationStatus, OrderStatus } from "../types/enums";
import { toDate, toDateOrEpoch } from "./dates";

export type ConversationParticipant = {
  userId: number;
  role: ConversationParticipantRole;
  roleLabel: string;
  name: string;
  phone: string | null;
  isMe: boolean;
  lastReadAt: Date | null;
};

export type ConversationRow = {
  id: number;
  status: ConversationStatus;
  statusLabel: string;
  isOpen: boolean;
  topicLabel: string;
  order: {
    id: number | null;
    orderNumber: string | null;
    status: OrderStatus | null;
    statusLabel: string | null;
    vendorName: string | null;
  } | null;
  participants: ConversationParticipant[];
  /** Whoever is not staff, which is who a dispute is actually between. */
  customer: ConversationParticipant | null;
  rider: ConversationParticipant | null;
  /** Whether staff have already stepped in. */
  hasSupport: boolean;
  messageCount: number | null;
  lastMessageAt: Date | null;
  createdAt: Date;
};

export type MessageRow = {
  id: number;
  conversationId: number;
  /** `system` lines have no sender and are rendered centred, not as a bubble. */
  isSystem: boolean;
  body: string;
  senderId: number | null;
  senderName: string;
  senderRole: string | null;
  isMine: boolean;
  createdAt: Date;
};

export function toConversationRow(dto: AdminConversationDto): ConversationRow {
  const participants = (dto.participants ?? []).map(toParticipant);

  return {
    id: dto.id,
    status: dto.status,
    statusLabel: dto.status_label,
    isOpen: dto.is_open,
    topicLabel: dto.topic_label,
    order: dto.order
      ? {
          id: dto.order.id,
          orderNumber: dto.order.order_number,
          status: dto.order.status,
          statusLabel: dto.order.status_label,
          vendorName: dto.order.vendor_name,
        }
      : null,
    participants,
    customer: participants.find((person) => person.role === "customer") ?? null,
    rider: participants.find((person) => person.role === "rider") ?? null,
    // Prefer the flag the backend computes; fall back to the participant list
    // for a response that carried participants but not the counted column.
    hasSupport: dto.has_support ?? participants.some((person) => person.role === "admin"),
    messageCount: dto.message_count ?? null,
    lastMessageAt: toDate(dto.last_message_at),
    createdAt: toDateOrEpoch(dto.created_at),
  };
}

export function toMessageRow(dto: AdminMessageDto): MessageRow {
  return {
    id: dto.id,
    conversationId: dto.conversation_id,
    isSystem: dto.type === "system" || dto.sender === null,
    body: dto.body,
    senderId: dto.sender?.id ?? null,
    senderName: dto.sender?.name ?? "System",
    senderRole: dto.sender?.role ?? null,
    isMine: dto.is_mine,
    createdAt: toDateOrEpoch(dto.created_at),
  };
}

function toParticipant(dto: AdminConversationParticipantDto): ConversationParticipant {
  return {
    userId: dto.user_id,
    role: dto.role,
    roleLabel: dto.role_label,
    name: dto.name,
    phone: dto.phone,
    isMe: dto.is_me,
    lastReadAt: toDate(dto.last_read_at),
  };
}
