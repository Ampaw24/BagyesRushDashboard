import { PageHeader } from "../../_components/page-header";
import { ExportAction } from "../../_components/export-action";
import { NoPermissionState } from "../../_components/empty-state";
import { RidersTable } from "./riders-table";
import { listRiders } from "@/lib/services/riders.service";
import { toRiderRow } from "@/lib/mappers/rider.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam, readEnumParam, readParam } from "@/lib/api/query";
import { RIDER_STATUSES, type RiderStatus } from "@/lib/types/enums";

/** The two the API accepts; anything else is a 422 rather than a silent empty list. */
const CREDENTIAL_STATES = ["expired", "expiring"] as const;

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
    // An id now, and not narrowed to the active fleet: a rider registered
    // before a vehicle was retired still has to be findable.
    vehicle_type_id: Number(params?.vehicle_type_id) || undefined,
    is_online: readBooleanParam(params, "is_online"),
    // Paperwork that has lapsed, or is about to. Validated against the two
    // values the API accepts - an unknown one is a 422, not an empty list.
    credential_state: readEnumParam(params, "credential_state", CREDENTIAL_STATES),
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
          <div className="flex items-center gap-3">
            <ExportAction
              resource="riders"
              filters={{ search: list.search, status: fixedStatus, city: readParam(params, "city") }}
            />
            <span className="text-sm text-text-muted">
              {page.pagination.total.toLocaleString()} rider{page.pagination.total === 1 ? "" : "s"}
            </span>
          </div>
        }
      />
      <RidersTable
        riders={rows}
        pagination={page.pagination}
        canMessage={can(permissions, "communications.send")}
        canViewDocuments={can(permissions, "riders.documents")}
        permissions={{
          canModerate: can(permissions, "riders.moderate"),
          canUpdate: can(permissions, "riders.update"),
          canDelete: can(permissions, "riders.delete"),
        }}
        showStatusFilters={fixedStatus === undefined && fixedProfileComplete === undefined && !trashedOnly}
      />
    </div>
  );
}
