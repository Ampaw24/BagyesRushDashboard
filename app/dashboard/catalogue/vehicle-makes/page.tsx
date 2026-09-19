import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { VehicleMakesTable } from "./vehicle-makes-table";
import { listVehicleMakes } from "@/lib/services/vehicle-makes.service";
import { listAllVehicleTypes } from "@/lib/services/vehicle-types.service";
import { toVehicleMakeRow } from "@/lib/mappers/vehicle.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam } from "@/lib/api/query";

export const metadata: Metadata = { title: "Vehicle Makes — BagyesRUSH" };

export default async function VehicleMakesPage(props: PageProps<"/dashboard/catalogue/vehicle-makes">) {
  const permissions = await getPermissions();

  if (!can(permissions, "catalogue.manage")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Vehicle makes" description="Manufacturers, filed under the type they make." />
        <NoPermissionState what="the catalogue" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);
  const typeId = Number(params?.vehicle_type_id) || undefined;

  // The parent list feeds both the filter and the create form's select; the
  // table is small enough that one call covers both.
  const [page, types] = await Promise.all([
    listVehicleMakes({
      page: list.page,
      per_page: list.per_page,
      search: list.search,
      is_active: readBooleanParam(params, "is_active"),
      vehicle_type_id: typeId,
    }),
    listAllVehicleTypes(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vehicle makes"
        description="Honda under motorbikes and Honda under cars are two rows — a make belongs to exactly one type, so the rider app never offers a Toyota to somebody registering a bike."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} make{page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      <VehicleMakesTable
        makes={page.items.map(toVehicleMakeRow)}
        types={types.map((type) => ({ id: type.id, name: type.name, isActive: type.is_active }))}
        pagination={page.pagination}
      />
    </div>
  );
}
