import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { RiderDetail } from "./_components/rider-detail";
import { getRider } from "@/lib/services/riders.service";
import { getRiderWallet, listRiderTransactions } from "@/lib/services/wallets.service";
import { listActivity } from "@/lib/services/activity.service";
import { toRiderDetail } from "@/lib/mappers/rider.mapper";
import { toWalletSummary, toWalletTransactionRow } from "@/lib/mappers/wallet.mapper";
import { toActivityRow } from "@/lib/mappers/activity.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { EMPTY_VEHICLE_CATALOGUE, getVehicleCatalogue } from "@/lib/services/vehicle-catalogue.service";
import { isNotFound } from "@/lib/api/errors";

export const metadata: Metadata = {
  title: "Rider — BagyesRUSH",
};

export default async function RiderDetailPage(props: PageProps<"/dashboard/riders/[id]">) {
  const { id } = await props.params;
  const permissions = await getPermissions();

  if (!can(permissions, "riders.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Rider" description="Rider detail." />
        <NoPermissionState what="riders" />
      </div>
    );
  }

  const riderId = Number(id);
  if (!Number.isFinite(riderId)) notFound();

  const rider = await loadRider(riderId);

  // Each of these is behind its own permission, so they are requested only when
  // the role actually carries it rather than relying on a 403 to skip them.
  // Payout is not fetched here: every read is audit-logged, so it loads when
  // somebody opens the Payout tab rather than whenever the profile is opened.
  const canAdjustWallet = can(permissions, "riders.wallet");

  const [activity, wallet, transactions, catalogue] = await Promise.all([
    can(permissions, "audit.view")
      ? listActivity({
          subject_type: "Rider",
          subject_id: riderId,
          changes_only: true,
          per_page: 25,
        }).then((page) =>
          page.items.map(toActivityRow),
        )
      : Promise.resolve([]),
    canAdjustWallet
      ? getRiderWallet(riderId).then((result) => toWalletSummary(result.summary))
      : Promise.resolve(null),
    canAdjustWallet
      ? listRiderTransactions(riderId, { per_page: 50 }).then((page) =>
          page.items.map(toWalletTransactionRow),
        )
      : Promise.resolve([]),
    // The fleet tree, for the edit dialog's type -> make -> model picker.
    can(permissions, "riders.update") ? getVehicleCatalogue() : Promise.resolve(EMPTY_VEHICLE_CATALOGUE),
  ]);

  return (
    <RiderDetail
      rider={rider}
      catalogue={catalogue}
      activity={activity}
      wallet={wallet}
      transactions={transactions}
      permissions={{
        canModerate: can(permissions, "riders.moderate"),
        canUpdate: can(permissions, "riders.update"),
        canDelete: can(permissions, "riders.delete"),
        canViewDocuments: can(permissions, "riders.documents"),
        canAdjustWallet,
        canMessage: can(permissions, "communications.send"),
        canViewPayout: can(permissions, "riders.payout"),
      }}
    />
  );
}

/** A missing rider arrives as a 422 with `errors.rider`, not a 404. */
async function loadRider(id: number) {
  try {
    return toRiderDetail(await getRider(id));
  } catch (error) {
    unstable_rethrow(error);
    if (isNotFound(error, "rider")) notFound();
    throw error;
  }
}
