import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { BannersTable } from "./banners-table";
import { listBanners } from "@/lib/services/banners.service";
import { toBannerRow } from "@/lib/mappers/catalogue.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam, readEnumParam } from "@/lib/api/query";
import { BANNER_LINK_TYPES, BANNER_PLACEMENTS } from "@/lib/types/enums";

export const metadata: Metadata = {
  title: "Banners — Bagyes Rush Delivery",
};

export default async function BannersPage(props: PageProps<"/dashboard/catalogue/banners">) {
  const permissions = await getPermissions();

  if (!can(permissions, "catalogue.manage")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Banners" description="Merchandising slots in the customer app." />
        <NoPermissionState what="the catalogue" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const page = await listBanners({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    placement: readEnumParam(params, "placement", BANNER_PLACEMENTS),
    link_type: readEnumParam(params, "link_type", BANNER_LINK_TYPES),
    is_active: readBooleanParam(params, "is_active"),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Banners"
        description="Merchandising slots in the customer app. This list includes banners that are inactive or outside their scheduling window, which the storefront hides."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} banner
            {page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      <BannersTable banners={page.items.map(toBannerRow)} pagination={page.pagination} />
    </div>
  );
}
