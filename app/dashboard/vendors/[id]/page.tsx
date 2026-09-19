import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { VendorDetail } from "./_components/vendor-detail";
import { getVendor, getVendorPayout, listVendorMenuItems } from "@/lib/services/vendors.service";
import { listActivity } from "@/lib/services/activity.service";
import { listActiveBusinessTypes } from "@/lib/services/business-types.service";
import { getWallet, listWalletTransactions } from "@/lib/services/wallets.service";
import { toWalletSummary, toWalletTransactionRow } from "@/lib/mappers/wallet.mapper";
import { toMenuItemRow, toVendorDetail, toVendorPayout } from "@/lib/mappers/vendor.mapper";
import { toActivityRow } from "@/lib/mappers/activity.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { isNotFound } from "@/lib/api/errors";

export const metadata: Metadata = {
  title: "Vendor — BagyesRUSH",
};

export default async function VendorDetailPage(props: PageProps<"/dashboard/vendors/[id]">) {
  const { id } = await props.params;
  const permissions = await getPermissions();

  if (!can(permissions, "vendors.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Vendor" description="Vendor detail." />
        <NoPermissionState what="vendors" />
      </div>
    );
  }

  const vendorId = Number(id);
  if (!Number.isFinite(vendorId)) notFound();

  const vendor = await loadVendor(vendorId);

  // Each of these is behind its own permission, so they are requested only when
  // the role actually carries it rather than relying on a 403 to skip them.
  // Its own permission, separate from vendors.payout: reading where money goes
  // and seeing what is owed are different jobs.
  const canSeeWallet = can(permissions, "vendors.wallet");

  const [menuItems, payout, activity, wallet, transactions, businessTypes] = await Promise.all([
    can(permissions, "menu.view")
      ? listVendorMenuItems(vendorId, { per_page: 100 }).then((page) => page.items.map(toMenuItemRow))
      : Promise.resolve([]),
    can(permissions, "vendors.payout")
      ? getVendorPayout(vendorId).then(toVendorPayout)
      : Promise.resolve(null),
    can(permissions, "audit.view")
      ? listActivity({ subject_type: "Vendor", subject_id: vendorId, per_page: 25 }).then((page) =>
          page.items.map(toActivityRow),
        )
      : Promise.resolve([]),
    canSeeWallet
      ? getWallet("vendor", vendorId).then((result) => toWalletSummary(result.summary))
      : Promise.resolve(null),
    canSeeWallet
      ? listWalletTransactions("vendor", vendorId, { per_page: 50 }).then((page) =>
          page.items.map(toWalletTransactionRow),
        )
      : Promise.resolve([]),
    // For the edit dialog's business-type picker. Behind catalogue.manage,
    // which a vendors.update role need not hold — an empty list disables that
    // one field rather than taking the page down with a 403.
    can(permissions, "vendors.update") && can(permissions, "catalogue.manage")
      ? listActiveBusinessTypes().then((page) =>
          page.items.map((type) => ({ id: type.id, name: type.name })),
        )
      : Promise.resolve([]),
  ]);

  return (
    <VendorDetail
      vendor={vendor}
      menuItems={menuItems}
      businessTypes={businessTypes}
      payout={payout}
      activity={activity}
      wallet={wallet}
      transactions={transactions}
      permissions={{
        canModerate: can(permissions, "vendors.moderate"),
        canDelete: can(permissions, "vendors.delete"),
        canUpdateMenu: can(permissions, "menu.update"),
        canViewDocuments: can(permissions, "vendors.documents"),
        canAdjustWallet: canSeeWallet,
        canMessage: can(permissions, "communications.send"),
        canEdit: can(permissions, "vendors.update"),
      }}
    />
  );
}

/** A missing vendor arrives as a 422 with `errors.vendor`, not a 404. */
async function loadVendor(id: number) {
  try {
    return toVendorDetail(await getVendor(id));
  } catch (error) {
    unstable_rethrow(error);
    if (isNotFound(error, "vendor")) notFound();
    throw error;
  }
}
