"use client";

import { useState, type ReactNode } from "react";

import type { ActionMenuItem } from "../_components/action-menu";
import { SendMessageDialog, type MessageRecipient } from "../_components/send-message-dialog";
import { MailIcon } from "../_lib/icons";

/**
 * A "Send message" entry for any row that has a user behind it.
 *
 * Returns an action plus its dialog, the same shape `useCustomerActions` and
 * `useRiderStatusActions` use, so the three lists that need it each gain one
 * menu item rather than a bespoke button.
 *
 * Two things suppress it, and both are deliberate:
 *
 * - **No `communications.send`.** Sending SMS spends credits, so composing and
 *   sending are separate rights on the backend; a role without the second is
 *   not shown a button that would 403.
 * - **No user id.** Vendor and customer records can in principle exist without
 *   a linked account, and the endpoint takes a user id. Offering the action and
 *   then failing is worse than not offering it.
 */
export function useSendMessage(
  recipient: { userId: number | null; name: string; phone?: string | null },
  canSend: boolean,
): { actions: ActionMenuItem[]; dialog: ReactNode } {
  const [open, setOpen] = useState(false);

  if (!canSend || recipient.userId === null) {
    return { actions: [], dialog: null };
  }

  const target: MessageRecipient = {
    userId: recipient.userId,
    name: recipient.name,
    phone: recipient.phone ?? null,
  };

  return {
    actions: [{ label: "Send message", icon: MailIcon, onClick: () => setOpen(true) }],
    dialog: open ? <SendMessageDialog recipient={target} onClose={() => setOpen(false)} /> : null,
  };
}
