import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { VehicleTypesTable } from "./vehicle-types-table";
import { listVehicleTypes } from "@/lib/services/vehicle-types.service";
import { toVehicleTypeRow } from "@/lib/mappers/vehicle.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam } from "@/lib/api/query";

export const metadata: Metadata = { title: "Vehicle Types — BagyesRUSH" };

export default async function VehicleTypesPage(props: PageProps<"/dashboard/catalogue/vehicle-types">) {
  const permissions = await getPermissions();

  if (!can(permissions, "catalogue.manage")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Vehicle types" description="What a rider is allowed to ride." />
        <NoPermissionState what="the catalogue" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const page = await listVehicleTypes({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    is_active: readBooleanParam(params, "is_active"),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vehicle types"
        description="Only active types can be registered, and the rider app builds its picker from this list. Activating one also widens the parcel sizes customers are offered."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} type{page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      <VehicleTypesTable types={page.items.map(toVehicleTypeRow)} pagination={page.pagination} />
    </div>
  );
}
