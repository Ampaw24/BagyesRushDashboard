"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";

import { PageHeader } from "../../../_components/page-header";
import { Badge } from "../../../_components/status-badge";
import { useToast } from "../../../_components/toast-provider";
import { conversationStatusMeta, orderStatusMeta } from "../../../_lib/status";
import { formatDateTime, formatRelative } from "../../../_lib/format";
import {
  closeConversationAction,
  loadConversationMessagesAction,
  replyToConversationAction,
} from "../../_actions";
import type { ConversationRow, MessageRow } from "@/lib/mappers/conversation.mapper";
import { reopenConversationAction } from "../../_actions";

/** How often an open thread re-reads itself while somebody is looking at it. */
const POLL_MS = 10_000;

/**
 * One delivery conversation, end to end.
 *
 * Polled rather than socket-backed, deliberately. The dashboard already runs
 * Echo for the rider map, but a support agent reading a transcript needs it to
 * be *there*, not to arrive; ten seconds is well inside the rhythm of a typed
 * argument, and it costs one request rather than a standing subscription per
 * thread somebody happens to open. The channel authoriser was widened to admins
 * anyway, so moving to a socket later is a change here and nowhere else.
 */
export function ConversationThread({
  conversation,
  messages: initialMessages,
  canReply,
}: {
  conversation: ConversationRow;
  messages: MessageRow[];
  canReply: boolean;
}) {
  const { notify } = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, startSending] = useTransition();
  const [moderating, startModerating] = useTransition();

  const scrollRef = useRef<HTMLDivElement>(null);
  const count = messages.length;

  // Pinned to the bottom, the way every chat is: the newest line is the one
  // being read, and a transcript that opens at the top makes somebody scroll
  // through a week to find today.
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [count]);

  useEffect(() => {
    if (!conversation.isOpen) return;

    const timer = setInterval(() => {
      loadConversationMessagesAction(conversation.id).then((result) => {
        if (result.ok) setMessages(result.data);
      });
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [conversation.id, conversation.isOpen]);

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
      const refreshed = await loadConversationMessagesAction(conversation.id);
      if (refreshed.ok) setMessages(refreshed.data);
    });
  }

  function toggleOpen() {
    startModerating(async () => {
      const result = conversation.isOpen
        ? await closeConversationAction(conversation.id)
        : await reopenConversationAction(conversation.id);
      notify(result);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {conversation.order?.orderNumber ?? `Thread #${conversation.id}`}
            <Badge meta={conversationStatusMeta[conversation.status]} />
            {conversation.order?.status && <Badge meta={orderStatusMeta[conversation.order.status]} />}
          </span>
        }
        description={
          conversation.order?.vendorName
            ? `${conversation.topicLabel} · ${conversation.order.vendorName}`
            : conversation.topicLabel
        }
        action={
          <div className="flex items-center gap-3">
            {conversation.order?.id && (
              <Link
                href={`/dashboard/orders/${conversation.order.id}`}
                className="flex h-11 items-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
              >
                View order
              </Link>
            )}
            {canReply && (
              <button
                type="button"
                onClick={toggleOpen}
                disabled={moderating}
                className="flex h-11 items-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-60"
              >
                {conversation.isOpen ? "Close thread" : "Reopen thread"}
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <div ref={scrollRef} className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-muted">
                Nothing has been said in this thread yet.
              </p>
            ) : (
              messages.map((message) => <Bubble key={message.id} message={message} />)
            )}
          </div>

          {canReply ? (
            conversation.isOpen ? (
              <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={3}
                  disabled={sending}
                  placeholder="Reply as support. Both the customer and the rider will see this."
                  className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="break-words text-xs text-text-muted">
                    {conversation.hasSupport
                      ? "Staff are already in this thread."
                      : "Replying puts a visible support seat in this conversation."}
                  </p>
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending || body.trim().length === 0}
                    className="flex h-11 shrink-0 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {sending ? "Sending…" : "Send reply"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="break-words border-t border-border-subtle pt-4 text-sm text-text-muted">
                This thread is closed and read-only. Reopen it to reply — nothing was deleted.
              </p>
            )
          ) : (
            <p className="break-words border-t border-border-subtle pt-4 text-sm text-text-muted">
              Your role can read this conversation but not reply in it.
            </p>
          )}
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <h2 className="break-words text-sm font-semibold text-foreground">In this conversation</h2>
          <ul className="flex flex-col gap-3">
            {conversation.participants.map((person) => (
              <li key={person.userId} className="flex flex-col gap-0.5">
                <span className="break-words text-sm font-medium text-foreground">{person.name}</span>
                <span className="text-xs text-text-muted">{person.roleLabel}</span>
                {person.phone && (
                  // The number, because following a dispute up almost always
                  // means calling somebody.
                  <a
                    href={`tel:${person.phone}`}
                    className="break-words text-xs text-brand transition duration-150 hover:opacity-80"
                  >
                    {person.phone}
                  </a>
                )}
                <span className="text-xs text-text-muted">
                  {person.lastReadAt ? `Read ${formatRelative(person.lastReadAt)}` : "Not read yet"}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: MessageRow }) {
  // System lines are the platform speaking, not a person — centred and quiet so
  // they read as stage directions rather than as somebody's message.
  if (message.isSystem) {
    return (
      <p className="self-center break-words rounded-full bg-surface-muted px-3 py-1 text-xs text-text-muted">
        {message.body}
      </p>
    );
  }

  const mine = message.isMine;

  return (
    <div className={`flex max-w-[80%] flex-col gap-1 ${mine ? "self-end items-end" : "self-start"}`}>
      <span className="break-words text-xs text-text-muted">
        {message.senderName} · {formatDateTime(message.createdAt)}
      </span>
      <p
        className={`break-words rounded-xl px-3.5 py-2.5 text-sm ${
          mine
            ? "bg-brand text-brand-foreground"
            : "bg-surface-muted text-foreground"
        }`}
      >
        {message.body}
      </p>
    </div>
  );
}
