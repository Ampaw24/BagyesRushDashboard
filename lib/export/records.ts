import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDateTimeOrDash,
} from "@/app/dashboard/_lib/format";
import { riderCredentialLabels, riderDocumentLabels, vendorDocumentLabels } from "@/lib/types/enums";
import type { ConversationRow, MessageRow } from "@/lib/mappers/conversation.mapper";
import type { OrderDetail } from "@/lib/mappers/order.mapper";
import type { RiderDetail } from "@/lib/mappers/rider.mapper";
import type { VendorDetail } from "@/lib/mappers/vendor.mapper";
import type { ExportableRecord } from "./record-export";

/**
 * The shape of an exported rider or vendor, in one place.
 *
 * Each of these is reachable from two screens — the quick-view dialog and the
 * full profile — and an export that differs depending on which button somebody
 * happened to press is a support conversation waiting to happen. Defined here,
 * both call sites produce the same document.
 *
 * Payout details are deliberately absent. They sit behind their own permission
 * (`riders.payout` / `vendors.payout`), every read of them is written to the
 * audit log, and the API only ever returns the last four digits. A file that
 * can be emailed onwards is the wrong place for any of that, and an export is
 * not a way around a permission.
 */

const dash = (value: string | null | undefined): string => value ?? "—";

export function riderRecord(rider: RiderDetail): ExportableRecord {
  const expired = new Set(rider.credentials.expired.map((entry) => entry.field));

  const expiry = (date: Date | null, field: string): string => {
    if (!date) return "Not set";

    return `${formatDate(date)}${expired.has(field) ? " (expired)" : ""}`;
  };

  return {
    kind: "Rider",
    title: rider.name,
    subtitle: `${rider.riderCode}${rider.phone ? ` · ${rider.phone}` : ""}`,
    sections: [
      {
        title: "Rider",
        fields: [
          { label: "Full name", value: rider.name },
          { label: "Rider code", value: rider.riderCode },
          { label: "Phone", value: dash(rider.phone) },
          { label: "Email", value: dash(rider.email) },
          {
            label: "Date of birth",
            value: rider.dateOfBirth ? formatDate(rider.dateOfBirth) : "—",
          },
          {
            label: rider.identity.typeLabel ?? "Identity document",
            value: dash(rider.identity.number),
          },
          { label: "Address", value: dash(rider.residentialAddress) },
          { label: "City", value: dash(rider.city) },
          {
            label: "Emergency contact",
            value: rider.emergencyContact.name
              ? `${rider.emergencyContact.name}${
                  rider.emergencyContact.relationship
                    ? ` (${rider.emergencyContact.relationship})`
                    : ""
                }${rider.emergencyContact.phone ? ` · ${rider.emergencyContact.phone}` : ""}`
              : "—",
          },
        ],
      },
      {
        title: "Status",
        fields: [
          { label: "Status", value: rider.statusLabel },
          { label: "Online now", value: rider.isOnline ? "Yes" : "No" },
          { label: "Cleared to go online", value: rider.canGoOnline ? "Yes" : "No" },
          { label: "Joined", value: formatDate(rider.joinedAt) },
          { label: "Approved", value: formatDateTimeOrDash(rider.approvedAt) },
          { label: "Last online", value: formatDateTimeOrDash(rider.lastOnlineAt) },
          ...(rider.rejectionReason
            ? [{ label: "Reason", value: rider.rejectionReason }]
            : []),
          ...(rider.missingProfileFields.length > 0
            ? [
                {
                  label: "Onboarding incomplete",
                  value: rider.missingProfileFields.map((f) => f.replace(/_/g, " ")).join(", "),
                },
              ]
            : []),
        ],
      },
      {
        title: "Vehicle",
        fields: [
          { label: "Type", value: dash(rider.vehicleTypeLabel) },
          {
            label: "Number plate",
            value: rider.plateNumber ?? (rider.requiresPlate ? "Not supplied" : "Not required"),
          },
          { label: "Make", value: dash(rider.vehicle.make) },
          { label: "Model", value: dash(rider.vehicle.model) },
          { label: "Colour", value: dash(rider.vehicle.colour) },
          { label: "Year", value: rider.vehicle.year?.toString() ?? "—" },
          { label: "Ownership", value: dash(rider.vehicle.ownershipLabel) },
        ],
      },
      {
        title: "Compliance",
        fields: [
          { label: "Licence number", value: dash(rider.licence.number) },
          { label: "Licence class", value: dash(rider.licence.class) },
          {
            label: "Licence expires",
            value: expiry(rider.licence.expiresAt, "licence_expires_at"),
          },
          { label: "Permit number", value: dash(rider.licence.permitNumber) },
          {
            label: "Permit expires",
            value: expiry(rider.licence.permitExpiresAt, "permit_expires_at"),
          },
          { label: "Insurance provider", value: dash(rider.insurance.provider) },
          { label: "Policy number", value: dash(rider.insurance.policyNumber) },
          {
            label: "Insurance expires",
            value: expiry(rider.insurance.expiresAt, "insurance_expires_at"),
          },
          {
            label: "Roadworthy expires",
            value: expiry(rider.insurance.roadworthyExpiresAt, "roadworthy_expires_at"),
          },
          ...(rider.credentials.expired.length > 0
            ? [
                {
                  label: "Grounded by",
                  value: rider.credentials.expired
                    .map((e) => riderCredentialLabels[e.field] ?? e.field)
                    .join(", "),
                },
              ]
            : []),
          {
            label: "Rider agreement",
            value: rider.consent.termsAcceptedAt
              ? `Accepted ${formatDate(rider.consent.termsAcceptedAt)} (version ${
                  rider.consent.termsVersion ?? "unknown"
                })`
              : "Not accepted",
          },
        ],
      },
      {
        title: "Documents",
        fields: rider.documents
          .filter((document) => document.required)
          .map((document) => ({
            label: riderDocumentLabels[document.type],
            value: document.uploaded ? "Uploaded" : "Not uploaded",
          })),
      },
      {
        title: "Record",
        fields: [
          { label: "Deliveries completed", value: rider.deliveriesCompleted.toLocaleString() },
          {
            label: "Rating",
            value:
              rider.reviewCount > 0
                ? `${rider.rating.toFixed(1)} (${rider.reviewCount} reviews)`
                : "No reviews yet",
          },
          { label: "Wallet balance", value: formatCurrency(rider.walletBalance) },
          { label: "Lifetime earned", value: formatCurrency(rider.lifetimeEarned) },
          {
            label: "Delivery radius",
            value:
              rider.maxDeliveryRadiusKm !== null
                ? `${rider.maxDeliveryRadiusKm} km`
                : `Not set — platform default (${rider.effectiveMaxDeliveryRadiusKm} km)`,
          },
          {
            label: "Jobs at once",
            value:
              rider.maxConcurrentJobs !== null
                ? String(rider.maxConcurrentJobs)
                : `Not set — platform default (${rider.effectiveMaxConcurrentJobs})`,
          },
        ],
      },
    ],
  };
}

export function vendorRecord(vendor: VendorDetail): ExportableRecord {
  return {
    kind: "Vendor",
    title: vendor.businessName,
    subtitle: `${vendor.vendorId}${vendor.phone ? ` · ${vendor.phone}` : ""}`,
    sections: [
      {
        title: "Business",
        fields: [
          { label: "Business name", value: vendor.businessName },
          { label: "Vendor ID", value: vendor.vendorId },
          { label: "Type", value: dash(vendor.businessType) },
          { label: "Contact person", value: vendor.contactPersonName },
          { label: "Phone", value: dash(vendor.phone) },
          { label: "Email", value: dash(vendor.email) },
          { label: "Address", value: vendor.businessAddress },
          { label: "City", value: vendor.city },
          { label: "Tax ID", value: dash(vendor.taxIdentificationNumber) },
        ],
      },
      {
        title: "Status",
        fields: [
          { label: "Status", value: vendor.statusLabel },
          { label: "Accepting orders", value: vendor.isActive ? "Yes" : "No" },
          { label: "Vendor switch", value: vendor.isOpen ? "On" : "Off" },
          { label: "Open right now", value: vendor.isOpenNow ? "Yes" : "No" },
          { label: "Featured", value: vendor.isFeatured ? "Yes" : "No" },
          { label: "Profile complete", value: vendor.isProfileComplete ? "Yes" : "No" },
          { label: "Joined", value: formatDate(vendor.joinedAt) },
          ...(vendor.rejectionReason
            ? [{ label: "Rejection reason", value: vendor.rejectionReason }]
            : []),
        ],
      },
      {
        title: "Trading",
        fields: [
          {
            label: "Hours",
            value:
              vendor.openingTime && vendor.closingTime
                ? `${vendor.openingTime} – ${vendor.closingTime}`
                : "Not set",
          },
          {
            label: "Operating days",
            value: vendor.operatingDays.length > 0 ? vendor.operatingDays.join(", ") : "Not set",
          },
          { label: "Vendor delivery fee", value: formatCurrency(vendor.deliveryFee) },
          { label: "Minimum order", value: formatCurrency(vendor.minOrder) },
          {
            label: "Delivery time shown",
            value: `${vendor.deliveryTimeMin}–${vendor.deliveryTimeMax} min`,
          },
          {
            label: "Prep time",
            value: vendor.estimatedPrepTimeMinutes ? `${vendor.estimatedPrepTimeMinutes} min` : "—",
          },
          {
            label: "Delivery radius",
            value: vendor.deliveryRadiusKm !== null ? `${vendor.deliveryRadiusKm} km` : "Not set",
          },
          {
            label: "Rating",
            value:
              vendor.reviewCount > 0
                ? `${vendor.rating.toFixed(1)} (${vendor.reviewCount} reviews)`
                : "No reviews yet",
          },
        ],
      },
      {
        title: "Listing",
        fields: [
          { label: "Description", value: dash(vendor.description) },
          {
            label: "Categories",
            value: vendor.categories.length > 0 ? vendor.categories.join(", ") : "None",
          },
          {
            label: "Cuisine types",
            value: vendor.cuisineTypes.length > 0 ? vendor.cuisineTypes.join(", ") : "None",
          },
          { label: "Promo text", value: dash(vendor.promoText) },
        ],
      },
      {
        title: "Documents",
        fields: [
          ...vendor.documents.map((document) => ({
            label: vendorDocumentLabels[document.type],
            value: document.uploaded ? "Uploaded" : "Not uploaded",
          })),
          { label: "Reviewed", value: formatDateTimeOrDash(vendor.documentsReviewedAt) },
          {
            label: "Payout destination",
            value: vendor.payoutConfigured ? "On file" : "Not set — they cannot be paid",
          },
        ],
      },
    ],
  };
}

/**
 * An order, as a record somebody can file or send on.
 *
 * The most useful of the three: this is what gets forwarded when a customer
 * disputes a charge, when a vendor questions a payout, or when a rider's
 * delivery is queried. So the money breakdown is included in full, line by
 * line, and it reconciles the same way the backend assembles it —
 * `subtotal − discount + delivery + service = total`.
 *
 * Every line carries its options and their surcharges, because "the total looks
 * wrong" is almost always a question about an addon somebody forgot they
 * chose.
 */
export function orderRecord(order: OrderDetail): ExportableRecord {
  return {
    kind: "Order",
    title: order.orderNumber,
    subtitle: `${order.typeLabel} · ${order.statusLabel} · placed ${formatDateTime(order.placedAt)}`,
    sections: [
      {
        title: "Order",
        fields: [
          { label: "Order number", value: order.orderNumber },
          { label: "Type", value: order.typeLabel },
          { label: "Status", value: order.statusLabel },
          { label: "Placed", value: formatDateTime(order.placedAt) },
          { label: "Payment status", value: order.paymentStatus },
          { label: "Payment method", value: order.paymentMethod },
          ...(order.notes ? [{ label: "Notes", value: order.notes }] : []),
          ...(order.rejectionReason
            ? [{ label: "Rejection reason", value: order.rejectionReason }]
            : []),
          ...(order.cancellationReason
            ? [{ label: "Cancellation reason", value: order.cancellationReason }]
            : []),
        ],
      },
      {
        title: "Customer",
        fields: [
          { label: "Name", value: order.customerName },
          { label: "Phone", value: dash(order.customerPhone) },
          { label: "Email", value: dash(order.customerEmail) },
          { label: "Deliver to", value: order.recipientName },
          { label: "Recipient phone", value: order.recipientPhone },
          { label: "Address", value: order.address },
        ],
      },
      {
        title: "Vendor",
        fields: [
          { label: "Vendor", value: dash(order.vendorName) },
          { label: "Phone", value: dash(order.vendorPhone) },
        ],
      },
      {
        title: "Rider",
        fields: order.rider
          ? [
              { label: "Name", value: dash(order.rider.name) },
              { label: "Phone", value: dash(order.riderPhone) },
            ]
          : [{ label: "Rider", value: "Not assigned" }],
      },
      {
        title: "Items",
        fields: order.items.map((item) => ({
          label: `${item.quantity} × ${item.name}`,
          value: [
            formatCurrency(item.lineTotal),
            ...item.options.map(
              (option) =>
                `${option.groupName}: ${option.name}${
                  option.additionalPrice > 0 ? ` (+${formatCurrency(option.additionalPrice)})` : ""
                }`,
            ),
            ...(item.notes ? [`Note: ${item.notes}`] : []),
          ].join(" · "),
        })),
      },
      {
        title: "Money",
        fields: [
          { label: "Subtotal", value: formatCurrency(order.subtotal) },
          { label: "Discount", value: formatCurrency(order.discount) },
          // As quoted, before any free-delivery waiver - the waiver lives in
          // the discount, and reporting both would double-count it.
          { label: "Delivery fee", value: formatCurrency(order.deliveryFee) },
          { label: "Service fee", value: formatCurrency(order.serviceFee) },
          { label: "Total", value: formatCurrency(order.total) },
          // Every earnings figure is nullable: an order that has not settled
          // yet has no split to report, and a confident "GH0.00" would read as
          // "nobody is owed anything" rather than "not yet decided".
          ...(order.earnings
            ? ([
                ["Vendor earns", order.earnings.vendor],
                ["Vendor commission", order.earnings.vendorCommission],
                ["Rider earns", order.earnings.rider],
                ["Rider commission", order.earnings.riderCommission],
                ["Platform keeps", order.earnings.platformKeeps],
              ].filter(([, amount]) => amount !== null) as [string, number][]).map(
                ([label, amount]) => ({ label, value: formatCurrency(amount) }),
              )
            : []),
          ...(order.refund.refunded > 0
            ? [{ label: "Refunded", value: formatCurrency(order.refund.refunded) }]
            : []),
        ],
      },
      {
        title: "Timeline",
        fields: order.timeline
          .filter((step) => step.at !== null)
          .map((step) => ({
            label: step.label,
            value: formatDateTime(step.at as Date),
          })),
      },
    ],
  };
}

/**
 * A chat transcript, for the dispute it will end up in.
 *
 * What was said about a delivery is what a disagreement weeks later turns on —
 * it is why `chat:close-stale` makes a thread read-only rather than deleting
 * it. Until now that record could only be read on screen, so settling anything
 * with a vendor or an insurer meant screenshots.
 *
 * Each line becomes a field: who and when as the label, what they said as the
 * value. That reads correctly in all three formats — as a transcript when
 * printed, and as one row per message in CSV, which is what anybody filtering
 * or searching a long thread actually wants.
 *
 * System lines are kept. "Rider assigned" and "Conversation closed" are part of
 * the sequence, and a transcript that silently drops them invites the question
 * of what else is missing.
 */
export function conversationRecord(
  conversation: ConversationRow,
  messages: MessageRow[],
): ExportableRecord {
  const order = conversation.order;

  return {
    kind: "Conversation",
    title: order?.orderNumber ? `Chat — order ${order.orderNumber}` : `Chat #${conversation.id}`,
    subtitle: [
      conversation.topicLabel,
      conversation.statusLabel,
      `${messages.length} message${messages.length === 1 ? "" : "s"}`,
    ]
      .filter(Boolean)
      .join(" · "),
    sections: [
      {
        title: "Conversation",
        fields: [
          { label: "Order", value: dash(order?.orderNumber) },
          { label: "Order status", value: dash(order?.statusLabel) },
          { label: "Vendor", value: dash(order?.vendorName) },
          { label: "Topic", value: conversation.topicLabel },
          { label: "Status", value: conversation.statusLabel },
          { label: "Customer", value: dash(conversation.customer?.name) },
          { label: "Rider", value: dash(conversation.rider?.name) },
          { label: "Support joined", value: conversation.hasSupport ? "Yes" : "No" },
          { label: "Opened", value: formatDateTime(conversation.createdAt) },
          { label: "Last message", value: formatDateTimeOrDash(conversation.lastMessageAt) },
        ],
      },
      {
        title: "Transcript",
        fields: messages.map((message) => ({
          label: message.isSystem
            ? formatDateTime(message.createdAt)
            : `${message.senderName}${message.senderRole ? ` (${message.senderRole})` : ""} · ${formatDateTime(
                message.createdAt,
              )}`,
          value: message.isSystem ? `— ${message.body} —` : message.body,
        })),
      },
    ],
  };
}
