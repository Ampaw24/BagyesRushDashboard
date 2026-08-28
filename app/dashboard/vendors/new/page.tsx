import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { VendorComposer } from "../_components/vendor-composer";
import { listActiveCategories } from "@/lib/services/categories.service";
import { listActiveBusinessTypes } from "@/lib/services/business-types.service";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Add Vendor — BagyesRUSH",
};

export default async function NewVendorPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "vendors.create")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Add vendor" description="Onboard a new business onto BagyesRUSH." />
        <NoPermissionState what="vendor creation" />
      </div>
    );
  }

  // Reference data for the form. Both endpoints sit behind `catalogue.manage`,
  // which a vendor-creating role may not hold — an empty list is better than a
  // 403 that would take the whole page down.
  const [businessTypes, categories] = await Promise.all([
    can(permissions, "catalogue.manage")
      ? listActiveBusinessTypes().then((page) =>
          page.items.map((type) => ({ id: type.id, name: type.name })),
        )
      : Promise.resolve([]),
    can(permissions, "catalogue.manage")
      ? listActiveCategories().then((page) => page.items.map((category) => category.name))
      : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Add vendor" description="Onboard a new business onto BagyesRUSH." />
      <VendorComposer businessTypes={businessTypes} categories={categories} />
    </div>
  );
}
