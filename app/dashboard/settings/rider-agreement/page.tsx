import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { RiderAgreementManager } from "./rider-agreement-manager";
import { listRiderAgreements } from "@/lib/services/rider-agreements.service";
import { toRiderAgreementRow } from "@/lib/mappers/rider-agreement.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams } from "@/lib/api/query";

export const metadata: Metadata = { title: "Rider Agreement — BagyesRUSH" };

const DESCRIPTION =
  "The contract every rider signs. Exactly one version is in force; publishing a new one retires it.";

/**
 * The rider agreement, as published documents.
 *
 * This replaced a version string in config. A rider's record named that string
 * and nothing else, so "which contract did they sign" had no answer, the rider
 * app had nothing to display, and changing the terms meant a deploy.
 */
export default async function RiderAgreementPage(
  props: PageProps<"/dashboard/settings/rider-agreement">,
) {
  const permissions = await getPermissions();

  if (!can(permissions, "settings.manage")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Rider agreement" description={DESCRIPTION} />
        <NoPermissionState what="platform settings" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const page = await listRiderAgreements({
    page: list.page,
    per_page: list.per_page,
    search: list.search,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Rider agreement"
        description={DESCRIPTION}
        action={
          <span className="text-sm text-text-muted">
            {page.pagination.total.toLocaleString()} version
            {page.pagination.total === 1 ? "" : "s"}
          </span>
        }
      />
      <RiderAgreementManager
        agreements={page.items.map(toRiderAgreementRow)}
        pagination={page.pagination}
      />
    </div>
  );
}
