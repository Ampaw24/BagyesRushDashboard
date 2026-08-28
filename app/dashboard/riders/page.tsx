import type { Metadata } from "next";

import { PageHeader } from "../_components/page-header";
import { NoPermissionState } from "../_components/empty-state";
import { StatTile } from "../_components/stat-tile";
import { RidersTable } from "./_components/riders-table";
import { getRiderStats, listRiders } from "@/lib/services/riders.service";
import { toRiderRow } from "@/lib/mappers/rider.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam, readEnumParam, readParam } from "@/lib/api/query";
import { RIDER_STATUSES, VEHICLE_TYPES, type VehicleType } from "@/lib/types/enums";
import { ActivityIcon, ProfileTickIcon, RidersIcon, ProfileDeleteIcon } from "../_lib/icons";

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
      vehicle_type: readEnumParam(params, "vehicle_type", VEHICLE_TYPES) as VehicleType | undefined,
      is_online: readBooleanParam(params, "is_online"),
      with_trashed: readBooleanParam(params, "with_trashed"),
    }),
    getRiderStats(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Riders"
        description="Everyone delivering for BagyesRUSH — who is online now, who is waiting on a decision, and who is blocked."
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
        permissions={{
          canModerate: can(permissions, "riders.moderate"),
          canDelete: can(permissions, "riders.delete"),
        }}
      />
    </div>
  );
}
