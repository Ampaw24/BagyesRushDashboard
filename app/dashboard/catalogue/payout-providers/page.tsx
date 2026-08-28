import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState, NotDeployedState } from "../../_components/empty-state";
import { PayoutProvidersTable } from "./payout-providers-table";
import { listPayoutProviders } from "@/lib/services/payout-providers.service";
import { toPayoutProviderRow } from "@/lib/mappers/catalogue.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam, readEnumParam } from "@/lib/api/query";
import { PAYOUT_PROVIDER_TYPES } from "@/lib/types/enums";

export const metadata: Metadata = {
  title: "Payout Providers — BagyesRUSH",
};

/**
 * Where money can be sent.
 *
 * Vendors and riders pick from this list rather than typing a bank name, which
 * is what stopped "Ecobank Gh" and "Ecobank Ghana" being two records of one
 * bank. Keep it populated: a payout cannot be configured without it.
 */
export default async function PayoutProvidersPage(
  props: PageProps<"/dashboard/catalogue/payout-providers">,
) {
  const permissions = await getPermissions();

  if (!can(permissions, "catalogue.manage")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Payout providers" description="Banks and mobile money networks." />
        <NoPermissionState what="the catalogue" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const page = await listPayoutProviders({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
    type: readEnumParam(params, "type", PAYOUT_PROVIDER_TYPES),
    is_active: readBooleanParam(params, "is_active"),
  });

  if (!page) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Payout providers" description="Banks and mobile money networks." />
        <NotDeployedState what="Payout providers" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payout providers"
        description="The banks and mobile money networks vendors and riders can be paid through. They pick from this list rather than typing, so keep it current."
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} provider
            {page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      <PayoutProvidersTable
        providers={page.items.map(toPayoutProviderRow)}
        pagination={page.pagination}
      />
    </div>
  );
}
