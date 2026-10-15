"use client";

import { useState } from "react";

import { ViewConversationDialog } from "./view-conversation-dialog";

/** A link to a conversation that opens it in place rather than navigating. */
export function ConversationQuickViewLink({
  conversationId,
  className = "text-brand transition duration-150 hover:opacity-80",
  children,
}: {
  conversationId: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`text-left ${className}`}>
        {children}
      </button>
      {open && (
        <ViewConversationDialog conversationId={conversationId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
