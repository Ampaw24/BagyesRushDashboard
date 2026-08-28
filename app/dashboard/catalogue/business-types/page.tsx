import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { BusinessTypesTable } from "./business-types-table";
import { listBusinessTypes } from "@/lib/services/business-types.service";
import { toBusinessTypeRow } from "@/lib/mappers/catalogue.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam } from "@/lib/api/query";

export const metadata: Metadata = {
  title: "Business Types — BagyesRUSH",
};

export default async function BusinessTypesPage(
  props: PageProps<"/dashboard/catalogue/business-types">,
) {
  const permissions = await getPermissions();

  if (!can(permissions, "catalogue.manage")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Business types" description="The kinds of business that can register." />
        <NoPermissionState what="the catalogue" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const page = await listBusinessTypes({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    is_active: readBooleanParam(params, "is_active"),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Business types"
        description="The kinds of business that can register. A vendor must pick one at sign-up, so this list has to stay populated."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} type
            {page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      <BusinessTypesTable types={page.items.map(toBusinessTypeRow)} pagination={page.pagination} />
    </div>
  );
}
