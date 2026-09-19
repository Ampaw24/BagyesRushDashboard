import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { VehicleModelsTable } from "./vehicle-models-table";
import { listVehicleModels } from "@/lib/services/vehicle-models.service";
import { listAllVehicleMakes } from "@/lib/services/vehicle-makes.service";
import { toVehicleModelRow } from "@/lib/mappers/vehicle.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam } from "@/lib/api/query";

export const metadata: Metadata = { title: "Vehicle Models — BagyesRUSH" };

export default async function VehicleModelsPage(props: PageProps<"/dashboard/catalogue/vehicle-models">) {
  const permissions = await getPermissions();

  if (!can(permissions, "catalogue.manage")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Vehicle models" description="Specific models, filed under their manufacturer." />
        <NoPermissionState what="the catalogue" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);
  const makeId = Number(params?.vehicle_make_id) || undefined;

  const [page, makes] = await Promise.all([
    listVehicleModels({
      page: list.page,
      per_page: list.per_page,
      search: list.search,
      is_active: readBooleanParam(params, "is_active"),
      vehicle_make_id: makeId,
    }),
    listAllVehicleMakes(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vehicle models"
        description="The last step of the rider's picker. A rider can only choose a model that belongs to the make they picked — an id from elsewhere is refused."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} model{page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      <VehicleModelsTable
        models={page.items.map(toVehicleModelRow)}
        makes={makes.map((make) => ({
          id: make.id,
          name: make.name,
          isActive: make.is_active,
          typeName: make.vehicle_type?.name ?? null,
        }))}
        pagination={page.pagination}
      />
    </div>
  );
}
