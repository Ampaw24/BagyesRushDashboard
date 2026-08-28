"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { BellIcon } from "../_lib/icons";
import { formatRelative } from "../_lib/format";
import {
  fetchNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "./_notification-actions";
import type { NotificationDto } from "@/lib/types/api";

/** How often to check for new alerts while the dashboard is open. */
const POLL_MS = 60_000;

/**
 * The bell in the header.
 *
 * Polls rather than holds a socket: the dashboard has a handful of concurrent
 * admins and a check a minute is cheaper in every sense than running a
 * websocket server for it. The interval pauses while the tab is hidden, so a
 * dashboard left open overnight is not asking a question every minute until
 * morning.
 *
 * Opening a notification marks it read and navigates to the record — an alert
 * you have acted on should not still be counted as waiting.
 */
export function NotificationBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const panel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = () => {
      // Inside a transition, and not optional.
      //
      // apiFetch redirects to /logout when the session has expired, and a
      // redirect thrown by a Server Action called outside a transition reaches
      // the client as a response it cannot apply - which surfaces as a
      // full-screen "unexpected response from the server" rather than sending
      // somebody to the login page. Any admin whose session lapsed with the
      // dashboard open would hit it, because this polls.
      startTransition(async () => {
        setLoading(true);
        const result = await fetchNotificationsAction();
        setLoading(false);

        if (result.ok) {
          setItems(result.data.items);
          setUnread(result.data.unread);
        }
      });
    };

    const tick = () => {
      // Nobody is looking, so nothing needs refreshing.
      if (document.visibilityState === "visible") load();
    };

    // Deferred rather than called straight from the effect body: load() sets
    // state synchronously, which would be a render-phase update.
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  // Click-away and Escape, so the panel behaves like every other menu here.
  useEffect(() => {
    if (!open) return;

    const onClick = (event: MouseEvent) => {
      if (panel.current && !panel.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openNotification = (notification: NotificationDto) => {
    if (!notification.is_read) {
      setUnread((count) => Math.max(0, count - 1));
      setItems((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)),
      );
      startTransition(() => {
        void markNotificationReadAction(notification.id);
      });
    }

    setOpen(false);
  };

  const markAll = () => {
    setUnread(0);
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    startTransition(() => {
      void markAllNotificationsReadAction();
    });
  };

  return (
    <div ref={panel} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition duration-150 hover:bg-surface-muted hover:text-foreground"
      >
        <BellIcon className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 flex w-88 max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-border-subtle bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-xs text-text-muted transition duration-150 hover:text-brand"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-text-muted">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-text-muted">Nothing new.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {items.map((notification) => {
                  const href = typeof notification.data.href === "string" ? notification.data.href : null;

                  const body = (
                    <span className="flex w-full flex-col gap-1 px-4 py-3 text-left">
                      <span className="flex items-start justify-between gap-2">
                        <span
                          className={`text-sm ${notification.is_read ? "text-text-secondary" : "font-medium text-foreground"}`}
                        >
                          {notification.title ?? "Notification"}
                        </span>
                        {!notification.is_read && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        )}
                      </span>
                      {notification.body && (
                        <span className="line-clamp-2 text-xs text-text-muted">{notification.body}</span>
                      )}
                      <span className="text-xs text-text-muted">
                        {notification.created_at ? formatRelative(new Date(notification.created_at)) : ""}
                      </span>
                    </span>
                  );

                  return (
                    <li key={notification.id} className="transition duration-150 hover:bg-surface-muted">
                      {href ? (
                        <Link href={href} onClick={() => openNotification(notification)} className="flex">
                          {body}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openNotification(notification)}
                          className="flex w-full"
                        >
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
