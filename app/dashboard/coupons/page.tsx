import type { Metadata } from "next";

import { PageHeader } from "../_components/page-header";
import { NoPermissionState } from "../_components/empty-state";
import { CouponsTable } from "./coupons-table";
import { listPromoCodes } from "@/lib/services/promo-codes.service";
import { toPromoCodeRow } from "@/lib/mappers/promo-code.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam, readEnumParam } from "@/lib/api/query";
import { PROMO_CODE_SCOPES } from "@/lib/types/enums";

export const metadata: Metadata = {
  title: "Coupons — Bagyes Rush Delivery",
};

export default async function CouponsPage(props: PageProps<"/dashboard/coupons">) {
  const permissions = await getPermissions();

  if (!can(permissions, "promos.manage")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Coupons" description="Discount codes available to customers at checkout." />
        <NoPermissionState what="promo codes" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const page = await listPromoCodes({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    scope: readEnumParam(params, "scope", PROMO_CODE_SCOPES),
    is_active: readBooleanParam(params, "is_active"),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Coupons"
        description="Discount codes available to customers at checkout."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} code{page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      <CouponsTable coupons={page.items.map(toPromoCodeRow)} pagination={page.pagination} />
    </div>
  );
}
