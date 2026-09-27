import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { EmptyState, NoPermissionState } from "../../_components/empty-state";
import { SessionsTable } from "./sessions-table";
import { listSessions } from "@/lib/services/security.service";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Active Sessions — BagyesRUSH",
};

/**
 * Who is signed in to the dashboard right now.
 *
 * Staff only. Every customer and rider token would be thousands of rows
 * answering a question nobody asked, and an app session is not something an
 * admin manages.
 */
export default async function SessionsPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "audit.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Active sessions" description="Who is signed in right now." />
        <NoPermissionState what="active sessions" />
      </div>
    );
  }

  const sessions = await listSessions();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Active sessions"
        description="Every staff session that is currently open. Staff sessions expire on their own after 12 hours; signing one out ends it immediately."
        action={
          <span className="text-sm text-text-muted">
            {sessions.length} open
          </span>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          title="Nobody is signed in"
          description="Sessions appear here as staff sign in, and drop off when they expire or sign out."
        />
      ) : (
        <SessionsTable sessions={sessions} canRevoke={can(permissions, "users.manage")} />
      )}
    </div>
  );
}
