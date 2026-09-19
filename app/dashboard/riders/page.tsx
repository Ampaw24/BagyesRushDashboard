import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "../_components/page-header";
import { ExportAction } from "./../_components/export-action";
import { NoPermissionState } from "../_components/empty-state";
import { StatTile } from "../_components/stat-tile";
import { RidersTable } from "./_components/riders-table";
import { getRiderStats, listRiders } from "@/lib/services/riders.service";
import { toRiderRow } from "@/lib/mappers/rider.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam, readEnumParam, readParam } from "@/lib/api/query";
import { RIDER_STATUSES } from "@/lib/types/enums";
import { ActivityIcon, ProfileTickIcon, RidersIcon, ProfileDeleteIcon } from "../_lib/icons";

/** The two the API accepts; anything else is a 422 rather than a silent empty list. */
const CREDENTIAL_STATES = ["expired", "expiring"] as const;

export const metadata: Metadata = {
  title: "Riders — BagyesRUSH",
};

export default async function RidersPage(props: PageProps<"/dashboard/riders">) {
  const permissions = await getPermissions();

  if (!can(permissions, "riders.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Riders" description="Everyone delivering for BagyesRUSH." />
        <NoPermissionState what="riders" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const [page, stats] = await Promise.all([
    listRiders({
      page: list.page,
      per_page: list.per_page,
      search: list.search,
      city: readParam(params, "city"),
      status: readEnumParam(params, "status", RIDER_STATUSES),
      // An id now, and not narrowed to the active fleet: a rider registered
    // before a vehicle was retired still has to be findable.
    vehicle_type_id: Number(params?.vehicle_type_id) || undefined,
      is_online: readBooleanParam(params, "is_online"),
      // Paperwork that has lapsed, or is about to. Validated against the two
      // values the API accepts - an unknown one is a 422, not an empty list.
      credential_state: readEnumParam(params, "credential_state", CREDENTIAL_STATES),
      with_trashed: readBooleanParam(params, "with_trashed"),
    }),
    getRiderStats(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Riders"
        description="Everyone delivering for BagyesRUSH — who is online now, who is waiting on a decision, and who is blocked."
        action={
          <div className="flex items-center gap-3">
            <ExportAction
              resource="riders"
              filters={{
                search: list.search,
                city: readParam(params, "city"),
                status: readEnumParam(params, "status", RIDER_STATUSES),
              }}
            />
            {can(permissions, "riders.create") && (
              <Link
                href="/dashboard/riders/new"
                className="flex h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
              >
                Add rider
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Online now"
          value={stats.online.toLocaleString()}
          icon={<ActivityIcon />}
        />
        <StatTile
          label="Awaiting review"
          value={stats.awaiting_review.toLocaleString()}
          icon={<ProfileTickIcon />}
        />
        <StatTile
          label="Incomplete onboarding"
          value={stats.incomplete.toLocaleString()}
          icon={<ProfileDeleteIcon />}
        />
        <StatTile label="Total riders" value={stats.total.toLocaleString()} icon={<RidersIcon />} />
      </div>

      <RidersTable
        riders={page.items.map(toRiderRow)}
        pagination={page.pagination}
        canMessage={can(permissions, "communications.send")}
        canViewDocuments={can(permissions, "riders.documents")}
        permissions={{
          canModerate: can(permissions, "riders.moderate"),
          canUpdate: can(permissions, "riders.update"),
          canDelete: can(permissions, "riders.delete"),
        }}
      />
    </div>
  );
}
