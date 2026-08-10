"use client";

import { useState } from "react";
import { PageHeader } from "../../../_components/page-header";
import { Badge } from "../../../_components/status-badge";
import { Tabs } from "../../../_components/tabs";
import { ActionMenu } from "../../../_components/action-menu";
import { useVendorStatusActions } from "../../../_hooks/use-vendor-status-actions";
import { vendorStatusMeta, verificationStatusMeta } from "../../../_lib/vendors";
import { VendorOverviewTab } from "./vendor-overview-tab";
import { VendorMenuTab } from "./vendor-menu-tab";
import { VendorOrdersTab } from "./vendor-orders-tab";
import { VendorActivityTab } from "./vendor-activity-tab";
import { VendorSettingsForm } from "./vendor-settings-form";
import type { Vendor, VendorMenuItem, VendorStatusEvent } from "../../../_services/vendors-mock-data";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "menu", label: "Menu" },
  { key: "orders", label: "Orders" },
  { key: "activity", label: "Activity" },
  { key: "settings", label: "Settings" },
];

export function VendorDetail({
  vendor: initialVendor,
  ownerEmail,
  menuItems,
  statusHistory,
}: {
  vendor: Vendor;
  ownerEmail?: string;
  menuItems: VendorMenuItem[];
  statusHistory: VendorStatusEvent[];
}) {
  const [vendor, setVendor] = useState(initialVendor);
  const [activeTab, setActiveTab] = useState("overview");
  const { actions, dialog } = useVendorStatusActions(vendor, (updates) => setVendor((prev) => ({ ...prev, ...updates })));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={vendor.businessName}
        description={`${vendor.category} · ${vendor.city}`}
        action={
          <div className="flex items-center gap-2">
            <Badge meta={vendorStatusMeta[vendor.status]} />
            <Badge meta={verificationStatusMeta[vendor.verificationStatus]} />
            <ActionMenu items={actions} />
          </div>
        }
      />

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && <VendorOverviewTab vendor={vendor} ownerEmail={ownerEmail} />}
      {activeTab === "menu" && <VendorMenuTab items={menuItems} />}
      {activeTab === "orders" && <VendorOrdersTab />}
      {activeTab === "activity" && <VendorActivityTab events={statusHistory} />}
      {activeTab === "settings" && <VendorSettingsForm vendor={vendor} onUpdate={(updates) => setVendor((prev) => ({ ...prev, ...updates }))} />}

      {dialog}
    </div>
  );
}
