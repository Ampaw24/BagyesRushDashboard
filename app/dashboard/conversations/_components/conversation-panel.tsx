"use client";

import { useEffect, useRef } from "react";

import { RelativeTime } from "../../_components/relative-time";
import { formatDateTime } from "../../_lib/format";
import type { ConversationRow, MessageRow } from "@/lib/mappers/conversation.mapper";

/**
 * The transcript and the reply box. Stateless: the thread itself lives in
 * `useConversationThread`, so the page and the dialog cannot disagree about
 * how a reply is sent or when the thread re-reads itself.
 */
export function ConversationTranscript({
  conversation,
  messages,
  canReply,
  body,
  onBodyChange,
  sending,
  onSend,
}: {
  conversation: ConversationRow;
  messages: MessageRow[];
  canReply: boolean;
  body: string;
  onBodyChange: (body: string) => void;
  sending: boolean;
  onSend: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const count = messages.length;

  // Pinned to the bottom, the way every chat is: the newest line is the one
  // being read, and a transcript that opens at the top makes somebody scroll
  // through a week to find today.
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [count]);

  return (
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
              onChange={(event) => onBodyChange(event.target.value)}
              rows={3}
              disabled={sending}
              placeholder="Reply as support. Both the customer and the rider will see this."
              className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="break-words text-xs text-text-muted">
                {conversation.hasSupport
                  ? "Staff are already in this thread."
                  : "Replying puts a visible support seat in this conversation."}
              </p>
              <button
                type="button"
                onClick={onSend}
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
  );
}

export function ConversationParticipants({ conversation }: { conversation: ConversationRow }) {
  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <h2 className="break-words text-sm font-semibold text-foreground">In this conversation</h2>
      <ul className="flex flex-col gap-3">
        {conversation.participants.map((person) => (
          <li key={person.userId} className="flex flex-col gap-0.5">
            <span className="break-words text-sm font-medium text-foreground">{person.name}</span>
            <span className="text-xs text-text-muted">{person.roleLabel}</span>
            {person.phone && (
              // The number, because following a dispute up almost always means
              // calling somebody.
              <a
                href={`tel:${person.phone}`}
                className="break-words text-xs text-brand transition duration-150 hover:opacity-80"
              >
                {person.phone}
              </a>
            )}
            <span className="text-xs text-text-muted">
              {person.lastReadAt ? (
                <>
                  Read <RelativeTime date={person.lastReadAt} />
                </>
              ) : (
                "Not read yet"
              )}
            </span>
          </li>
        ))}
      </ul>
    </aside>
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
          mine ? "bg-brand text-brand-foreground" : "bg-surface-muted text-foreground"
        }`}
      >
        {message.body}
      </p>
    </div>
  );
}
