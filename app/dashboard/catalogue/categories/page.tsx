import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { CategoriesTable } from "./categories-table";
import { listCategories } from "@/lib/services/categories.service";
import { toCategoryRow } from "@/lib/mappers/catalogue.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam } from "@/lib/api/query";

export const metadata: Metadata = {
  title: "Categories — BagyesRUSH",
};

export default async function CategoriesPage(props: PageProps<"/dashboard/catalogue/categories">) {
  const permissions = await getPermissions();

  if (!can(permissions, "catalogue.manage")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Categories" description="How dishes are grouped across the marketplace." />
        <NoPermissionState what="the catalogue" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const page = await listCategories({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    is_active: readBooleanParam(params, "is_active"),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        description="How dishes are grouped across the marketplace. Inactive categories are hidden from customers."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} categor
            {page.pagination.total === 1 ? "y" : "ies"}
          </span>
        }
      />
      <CategoriesTable
        categories={page.items.map(toCategoryRow)}
        pagination={page.pagination}
        canManage
      />
    </div>
  );
}
