import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { VendorDetail } from "./_components/vendor-detail";
import { getVendor, getVendorPayout, listVendorMenuItems } from "@/lib/services/vendors.service";
import { listActivity } from "@/lib/services/activity.service";
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
  const [menuItems, payout, activity] = await Promise.all([
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
  ]);

  return (
    <VendorDetail
      vendor={vendor}
      menuItems={menuItems}
      payout={payout}
      activity={activity}
      permissions={{
        canModerate: can(permissions, "vendors.moderate"),
        canDelete: can(permissions, "vendors.delete"),
        canUpdateMenu: can(permissions, "menu.update"),
        canViewDocuments: can(permissions, "vendors.documents"),
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
