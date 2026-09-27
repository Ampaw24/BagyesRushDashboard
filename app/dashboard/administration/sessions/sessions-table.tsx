"use client";

import { useTransition } from "react";

import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { RelativeTime } from "../../_components/relative-time";
import { useToast } from "../../_components/toast-provider";
import { revokeSessionAction } from "../_actions";
import type { SessionDto } from "@/lib/types/api";

/**
 * Staff sessions that are open right now.
 *
 * A Sanctum token *is* the session here — the API is stateless, so there is
 * nothing else to call one. Two addresses are shown rather than one: where a
 * session was opened is what somebody recognises ("that was me, on Tuesday"),
 * and where it is being used from *now* is what tells them it has been stolen.
 */
export function SessionsTable({ sessions, canRevoke }: { sessions: SessionDto[]; canRevoke: boolean }) {
  const { notify } = useToast();
  const [pending, start] = useTransition();

  return (
    <TableShell>
      <thead>
        <tr>
          <TableHeadCell>Administrator</TableHeadCell>
          <TableHeadCell>Opened from</TableHeadCell>
          <TableHeadCell>Last used from</TableHeadCell>
          <TableHeadCell>Device</TableHeadCell>
          <TableHeadCell>Last active</TableHeadCell>
          <TableHeadCell>Expires</TableHeadCell>
          <TableHeadCell>
            <span className="sr-only">Actions</span>
          </TableHeadCell>
        </tr>
      </thead>
      <tbody>
        {sessions.map((session) => {
          // Where it was opened versus where it is being used. A difference is
          // the single most useful signal on this screen.
          const moved =
            session.last_used_ip !== null &&
            session.ip_address !== null &&
            session.last_used_ip !== session.ip_address;

          return (
            <tr key={session.id}>
              <TableCell className="font-medium">
                {session.user?.name ?? session.user?.email ?? `User #${session.user?.id}`}
                <span className="mt-0.5 block text-xs font-normal capitalize text-text-muted">
                  {session.user?.admin_role?.replace(/_/g, " ") ?? "—"}
                  {session.is_current && (
                    <span className="ml-2 text-brand">this device</span>
                  )}
                </span>
              </TableCell>
              <TableCell className="tabular-nums text-text-secondary">
                {session.ip_address ?? "—"}
              </TableCell>
              <TableCell className="tabular-nums">
                <span className={moved ? "text-status-warning" : "text-text-secondary"}>
                  {session.last_used_ip ?? "—"}
                </span>
                {moved && (
                  <span className="mt-0.5 block text-xs text-status-warning">
                    Different address
                  </span>
                )}
              </TableCell>
              <TableCell className="max-w-xs truncate text-xs text-text-muted">
                {session.user_agent ?? "—"}
              </TableCell>
              <TableCell className="text-text-secondary">
                {session.last_used_at ? <RelativeTime date={session.last_used_at} /> : "Never used"}
              </TableCell>
              <TableCell className="text-text-secondary">
                {session.expires_at ? <RelativeTime date={session.expires_at} /> : "Does not expire"}
              </TableCell>
              <TableCell>
                {canRevoke && !session.is_current ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      start(async () => notify(await revokeSessionAction(session.id)))
                    }
                    className="text-sm font-medium text-status-critical transition duration-150 hover:underline disabled:opacity-50"
                  >
                    Sign out
                  </button>
                ) : (
                  <span className="text-xs text-text-muted">
                    {session.is_current ? "Current" : "—"}
                  </span>
                )}
              </TableCell>
            </tr>
          );
        })}
      </tbody>
    </TableShell>
  );
}
