import type { Metadata } from "next";

import { NoPermissionState } from "../../_components/empty-state";
import { PageHeader } from "../../_components/page-header";
import { RiderMap } from "./_components/rider-map";
import { can, getPermissions } from "@/lib/auth/guard";
import { listLiveRiders } from "@/lib/services/riders.service";

export const metadata: Metadata = {
  title: "Live map — BagyesRUSH",
};

/**
 * Where every rider is, right now.
 *
 * The list is fetched once on the server so the map has markers before any
 * JavaScript runs; after that the page holds a websocket open on the
 * `admin.riders` channel and moves the markers as positions arrive. It is
 * deliberately not polled — a dispatch map that refetched on a timer would be
 * both slower to update and heavier on the API than the socket replacing it.
 */
export default async function RidersLivePage() {
  const permissions = await getPermissions();

  if (!can(permissions, "riders.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Live map" description="Where every rider is right now." />
        <NoPermissionState what="riders" />
      </div>
    );
  }

  const riders = await listLiveRiders();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Live map"
        description="Every rider who is online and reporting a position. Click a bike for their details and what they are carrying."
      />

      <RiderMap seed={riders} />
    </div>
  );
}
