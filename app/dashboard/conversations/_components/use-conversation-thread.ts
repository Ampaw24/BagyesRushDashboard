"use client";

import { useEffect, useState, useTransition } from "react";

import { useToast } from "../../_components/toast-provider";
import {
  closeConversationAction,
  loadConversationMessagesAction,
  reopenConversationAction,
  replyToConversationAction,
} from "../_actions";
import type { ConversationRow, MessageRow } from "@/lib/mappers/conversation.mapper";

/** How often an open thread re-reads itself while somebody is looking at it. */
const POLL_MS = 10_000;

/**
 * The live half of a delivery conversation: polling, replying, closing.
 *
 * Shared by the full page and the quick-view dialog so both behave the same.
 * Polled rather than socket-backed, deliberately. The dashboard already runs
 * Echo for the rider map, but a support agent reading a transcript needs it to
 * be *there*, not to arrive; ten seconds is well inside the rhythm of a typed
 * argument, and it costs one request rather than a standing subscription per
 * thread somebody happens to open.
 */
export function useConversationThread({
  conversation,
  initialMessages,
  onModerated,
}: {
  conversation: ConversationRow;
  initialMessages: MessageRow[];
  /**
   * After a close or reopen lands. The page is refreshed by revalidation; the
   * dialog holds its own copy of the conversation and re-reads it here.
   */
  onModerated?: () => void;
}) {
  const { notify } = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, startSending] = useTransition();
  const [moderating, startModerating] = useTransition();

  useEffect(() => {
    if (!conversation.isOpen) return;

    const timer = setInterval(() => {
      loadConversationMessagesAction(conversation.id).then((result) => {
        if (result.ok) setMessages(result.data);
      });
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [conversation.id, conversation.isOpen]);

  async function refresh() {
    const refreshed = await loadConversationMessagesAction(conversation.id);
    if (refreshed.ok) setMessages(refreshed.data);
  }

  function send() {
    const text = body.trim();
    if (!text) return;

    startSending(async () => {
      const result = await replyToConversationAction(conversation.id, text);

      if (!result.ok) {
        notify(result);
        return;
      }

      setBody("");
      // Re-read rather than append: the first reply also posts the "Support has
      // joined" system line, and appending would show one and not the other.
      await refresh();
    });
  }

  function toggleOpen() {
    startModerating(async () => {
      const result = conversation.isOpen
        ? await closeConversationAction(conversation.id)
        : await reopenConversationAction(conversation.id);
      notify(result);

      if (result.ok) {
        // Closing posts a system line saying so.
        await refresh();
        onModerated?.();
      }
    });
  }

  return { messages, body, setBody, sending, send, moderating, toggleOpen };
}
