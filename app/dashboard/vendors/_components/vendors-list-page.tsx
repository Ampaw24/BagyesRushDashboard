import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { VendorsTable } from "./vendors-table";
import { listVendors } from "@/lib/services/vendors.service";
import { toVendorRow } from "@/lib/mappers/vendor.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam, readEnumParam, readParam } from "@/lib/api/query";
import { VENDOR_STATUSES, type VendorStatus } from "@/lib/types/enums";

/**
 * Shared body for the vendor list routes.
 *
 * The backend has no single "state" field: the sub-pages are combinations of
 * `status` and `is_active`. Active means approved *and* switched on; inactive
 * means approved but switched off.
 */
export async function VendorsListPage({
  title,
  description,
  fixedStatus,
  fixedIsActive,
  searchParams,
}: {
  title: string;
  description: string;
  fixedStatus?: VendorStatus;
  fixedIsActive?: boolean;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const permissions = await getPermissions();

  if (!can(permissions, "vendors.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={title} description={description} />
        <NoPermissionState what="vendors" />
      </div>
    );
  }

  const params = await searchParams;
  const list = parseListParams(params);

  const page = await listVendors({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    city: readParam(params, "city"),
    status: fixedStatus ?? readEnumParam(params, "status", VENDOR_STATUSES),
    is_active: fixedIsActive ?? readBooleanParam(params, "is_active"),
    with_trashed: readBooleanParam(params, "with_trashed"),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} vendor{page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      <VendorsTable
        vendors={page.items.map(toVendorRow)}
        pagination={page.pagination}
        permissions={{
          canModerate: can(permissions, "vendors.moderate"),
          canDelete: can(permissions, "vendors.delete"),
        }}
        showStatusFilters={fixedStatus === undefined && fixedIsActive === undefined}
      />
    </div>
  );
}
