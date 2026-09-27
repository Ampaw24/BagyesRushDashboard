import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState, EmptyState } from "../../_components/empty-state";
import { StatTile } from "../../_components/stat-tile";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { Pagination } from "../../_components/pagination";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { RelativeTime } from "../../_components/relative-time";
import { DangerIcon, ProfileTickIcon, ShieldIcon, UnlockIcon } from "../../_lib/icons";
import { getSecuritySummary, listAuthEvents } from "@/lib/services/security.service";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam, readParam } from "@/lib/api/query";

export const metadata: Metadata = {
  title: "Login History — BagyesRUSH",
};

const EVENT_FILTER: SelectFilter = {
  key: "event",
  label: "Event",
  allLabel: "All events",
  options: [
    { value: "login", label: "Signed in" },
    { value: "logout", label: "Signed out" },
    { value: "failed", label: "Failed sign-in" },
    { value: "locked_out", label: "Locked out" },
  ],
};

const CONCERN_FILTER: SelectFilter = {
  key: "concerning",
  label: "Show",
  allLabel: "Everything",
  options: [{ value: "1", label: "Failures and lockouts only" }],
};

const STAFF_FILTER: SelectFilter = {
  key: "staff_only",
  label: "Accounts",
  allLabel: "All accounts",
  options: [{ value: "1", label: "Staff only" }],
};

/**
 * Who signed in, who failed, and from where.
 *
 * The activity log records what an administrator did once they were inside.
 * Nothing recorded getting in — the lockout worked, but it lived in the cache
 * as a counter, so it could stop an attack in progress and then had nothing to
 * show anybody afterwards.
 *
 * Failed attempts are the point of this screen as much as successes. One wrong
 * password is somebody's morning; forty against one account overnight, or one
 * against each of two hundred accounts from a single address, is the shape of
 * an attack — and neither is visible one row at a time.
 */
export default async function LoginHistoryPage(
  props: PageProps<"/dashboard/administration/login-history">,
) {
  const permissions = await getPermissions();

  if (!can(permissions, "audit.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Login history" description="Sign-ins, sign-outs and failed attempts." />
        <NoPermissionState what="the sign-in history" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const [page, summary] = await Promise.all([
    listAuthEvents({
      page: list.page,
      per_page: list.per_page,
      search: list.search,
      event: readParam(params, "event"),
      ip: readParam(params, "ip"),
      concerning: readBooleanParam(params, "concerning"),
      staff_only: readBooleanParam(params, "staff_only"),
    }),
    getSecuritySummary(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Login history"
        description="Every sign-in, sign-out and failed attempt, with the address it came from."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={`Sign-ins (${summary.window_hours}h)`}
          value={summary.sign_ins.toLocaleString()}
          icon={<ProfileTickIcon />}
        />
        <StatTile
          label={`Failed (${summary.window_hours}h)`}
          value={summary.failed.toLocaleString()}
          icon={<DangerIcon />}
        />
        <StatTile
          label="Lockouts"
          value={summary.lockouts.toLocaleString()}
          icon={<UnlockIcon />}
        />
        {/* The number that distinguishes a forgotten password from an attack.
            One address failing forty times is somebody's morning; forty
            addresses failing once each is not. */}
        <StatTile
          label="Addresses failing"
          value={summary.failing_addresses.toLocaleString()}
          icon={<ShieldIcon />}
        />
      </div>

      <FilterBar
        searchPlaceholder="Search the phone or email that was entered"
        filters={[EVENT_FILTER, CONCERN_FILTER, STAFF_FILTER]}
      />

      {page.items.length === 0 ? (
        <EmptyState
          title="Nothing matches those filters"
          description="Sign-ins and failed attempts appear here as they happen."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Event</TableHeadCell>
                <TableHeadCell>Account</TableHeadCell>
                <TableHeadCell>Entered</TableHeadCell>
                <TableHeadCell>Reason</TableHeadCell>
                <TableHeadCell>Address</TableHeadCell>
                <TableHeadCell>Device</TableHeadCell>
                <TableHeadCell>When</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {page.items.map((event) => (
                <tr key={event.id}>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        event.is_concerning
                          ? "bg-status-critical/10 text-status-critical"
                          : "bg-surface-muted text-text-secondary"
                      }`}
                    >
                      {event.event_label}
                    </span>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {/* An attempt against a number nobody owns has no account
                        to name, and that is exactly the row worth seeing. */}
                    {event.user?.name ?? event.user?.email ?? (
                      <span className="text-text-muted">No such account</span>
                    )}
                    {event.role && (
                      <span className="mt-0.5 block text-xs capitalize text-text-muted">
                        {event.admin_role ?? event.role}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary">{event.identifier ?? "—"}</TableCell>
                  <TableCell className="text-text-secondary">{event.reason ?? "—"}</TableCell>
                  <TableCell className="tabular-nums text-text-secondary">
                    {event.ip_address ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-text-muted" >
                    {event.user_agent ?? "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {event.created_at ? <RelativeTime date={event.created_at} /> : "—"}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={page.pagination} />
        </>
      )}
    </div>
  );
}
