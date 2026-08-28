import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { RidersTable } from "./riders-table";
import { listRiders } from "@/lib/services/riders.service";
import { toRiderRow } from "@/lib/mappers/rider.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam, readEnumParam, readParam } from "@/lib/api/query";
import { RIDER_STATUSES, VEHICLE_TYPES, type RiderStatus, type VehicleType } from "@/lib/types/enums";

/**
 * Shared body for the rider list routes.
 *
 * The sub-pages are combinations of `status`, `is_profile_complete` and the
 * soft-delete rather than a single field — the same shape the vendor list pages
 * take. "Incomplete" in particular is not a status: it is someone who
 * registered and never finished onboarding, so there is nothing to review yet.
 */
export async function RidersListPage({
  title,
  description,
  fixedStatus,
  fixedProfileComplete,
  trashedOnly = false,
  searchParams,
}: {
  title: string;
  description: string;
  fixedStatus?: RiderStatus;
  fixedProfileComplete?: boolean;
  trashedOnly?: boolean;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const permissions = await getPermissions();

  if (!can(permissions, "riders.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={title} description={description} />
        <NoPermissionState what="riders" />
      </div>
    );
  }

  const params = await searchParams;
  const list = parseListParams(params);

  const page = await listRiders({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    city: readParam(params, "city"),
    status: fixedStatus ?? readEnumParam(params, "status", RIDER_STATUSES),
    vehicle_type: readEnumParam(params, "vehicle_type", VEHICLE_TYPES) as VehicleType | undefined,
    is_online: readBooleanParam(params, "is_online"),
    is_profile_complete: fixedProfileComplete,
    with_trashed: trashedOnly ? true : readBooleanParam(params, "with_trashed"),
  });

  // The API has no trashed-only filter — with_trashed widens the set rather
  // than replacing it — so the Deleted page narrows it here.
  const rows = page.items
    .map(toRiderRow)
    .filter((rider) => (trashedOnly ? rider.derivedState === "deleted" : true));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} rider{page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      <RidersTable
        riders={rows}
        pagination={page.pagination}
        permissions={{
          canModerate: can(permissions, "riders.moderate"),
          canDelete: can(permissions, "riders.delete"),
        }}
        showStatusFilters={fixedStatus === undefined && fixedProfileComplete === undefined && !trashedOnly}
      />
    </div>
  );
}
