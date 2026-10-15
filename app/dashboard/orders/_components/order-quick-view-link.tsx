"use client";

import { useState } from "react";

import { ViewOrderDialog } from "./view-order-dialog";

/**
 * An order reference that opens the order in place.
 *
 * Orders are referenced from half the dashboard — payments, refunds, ledgers,
 * reviews, complaints — and each of those used to be a link that threw the
 * admin out of the screen they were reading. This is a drop-in for that link:
 * same text, same styling, and the list stays where it was.
 */
export function OrderQuickViewLink({
  orderId,
  orderNumber,
  className = "text-brand transition duration-150 hover:opacity-80",
  children,
}: {
  orderId: number;
  orderNumber?: string;
  className?: string;
  /** Defaults to the order number. */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-left ${className}`}
      >
        {children ?? orderNumber ?? `#${orderId}`}
      </button>
      {open && (
        <ViewOrderDialog
          orderId={orderId}
          orderNumber={orderNumber}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
