import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "../../_components/page-header";
import { EmptyState, NoPermissionState } from "../../_components/empty-state";
import { RiderComposer } from "../_components/rider-composer";
import { can, getPermissions } from "@/lib/auth/guard";
import { getVehicleCatalogue } from "@/lib/services/vehicle-catalogue.service";

export const metadata: Metadata = {
  title: "Add Rider — BagyesRUSH",
};

/**
 * Onboarding a rider who did not register themselves.
 *
 * `POST /admin/riders` has existed since riders shipped and nothing on the
 * dashboard called it, so a rider who walked into the office had no way in —
 * vendors had this screen and riders did not.
 */
export default async function NewRiderPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "riders.create")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Add rider" description="Onboard a rider onto BagyesRUSH." />
        <NoPermissionState what="rider creation" />
      </div>
    );
  }

  // The type -> make -> model tree, fetched once so the picker cascades without
  // a round trip per step.
  const catalogue = await getVehicleCatalogue();

  // A rider cannot be created without a vehicle type, so say that plainly
  // rather than rendering a form whose submit can only ever 422.
  if (catalogue.types.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Add rider" description="Onboard a rider onto BagyesRUSH." />
        <EmptyState
          title="No vehicle types are set up yet"
          description="Every rider has to be registered against a vehicle. Add one under Catalogue → Vehicle types, then come back."
          action={
            <Link
              href="/dashboard/catalogue/vehicle-types"
              className="flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
            >
              Go to vehicle types
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add rider"
        description="Creates the account and a one-time password. They land pending review, like any other application."
      />
      <RiderComposer catalogue={catalogue} />
    </div>
  );
}
