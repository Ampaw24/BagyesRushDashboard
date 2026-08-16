"use client";

import { useState } from "react";

import { Badge } from "../../../_components/status-badge";
import { Tabs } from "../../../_components/tabs";
import { TableCell, TableHeadCell, TableShell } from "../../../_components/table-shell";
import { ActionMenu } from "../../../_components/action-menu";
import { EmptyState } from "../../../_components/empty-state";
import { PageHeader } from "../../../_components/page-header";
import { documentsStatusMeta, vendorStateMeta } from "../../../_lib/status";
import { formatCurrency, formatDate, formatDateTimeOrDash } from "../../../_lib/format";
import { StarIcon } from "../../../_lib/icons";
import { useToast } from "../../../_components/toast-provider";
import { useVendorStatusActions } from "../../../_hooks/use-vendor-status-actions";
import { toggleMenuItemAvailabilityAction } from "../../_actions";
import type { MenuItemRow, VendorDetail as VendorDetailModel, VendorPayout } from "@/lib/mappers/vendor.mapper";
import type { ActivityRow } from "@/lib/mappers/activity.mapper";
import { vendorDocumentLabels } from "@/lib/types/enums";

export type VendorDetailProps = {
  vendor: VendorDetailModel;
  menuItems: MenuItemRow[];
  /** Present only when the admin holds `vendors.payout`; every read is audit-logged. */
  payout: VendorPayout | null;
  /** From GET /admin/activity filtered to this vendor; empty without `audit.view`. */
  activity: ActivityRow[];
  permissions: {
    canModerate: boolean;
    canDelete: boolean;
    canUpdateMenu: boolean;
    canViewDocuments: boolean;
  };
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "menu", label: "Menu" },
  { key: "payout", label: "Payout" },
  { key: "activity", label: "Activity" },
];

export function VendorDetail({ vendor, menuItems, payout, activity, permissions }: VendorDetailProps) {
  const [tab, setTab] = useState("overview");
  const { actions, dialog } = useVendorStatusActions(vendor, permissions);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {vendor.businessName}
            <Badge meta={vendorStateMeta[vendor.derivedState]} />
            {vendor.isFeatured && (
              <span className="inline-flex items-center gap-1 text-sm font-normal text-brand">
                <StarIcon className="h-4 w-4" />
                Featured
              </span>
            )}
          </span>
        }
        description={`${vendor.vendorId} · joined ${formatDate(vendor.joinedAt)}`}
        action={actions.length > 0 ? <ActionMenu items={actions} /> : undefined}
      />

      {vendor.rejectionReason && (
        <p className="break-words rounded-xl border border-status-critical/30 bg-status-critical/5 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Rejection reason: </span>
          <span className="text-text-secondary">{vendor.rejectionReason}</span>
        </p>
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && <OverviewTab vendor={vendor} canViewDocuments={permissions.canViewDocuments} />}
      {tab === "menu" && (
        <MenuTab vendor={vendor} items={menuItems} canUpdate={permissions.canUpdateMenu} />
      )}
      {tab === "payout" && <PayoutTab vendor={vendor} payout={payout} />}
      {tab === "activity" && <ActivityTab activity={activity} />}

      {dialog}
    </div>
  );
}

function OverviewTab({
  vendor,
  canViewDocuments,
}: {
  vendor: VendorDetailModel;
  canViewDocuments: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Business">
        <Row label="Business name" value={vendor.businessName} />
        <Row label="Type" value={vendor.businessType ?? "—"} />
        <Row label="Contact person" value={vendor.contactPersonName} />
        <Row label="Address" value={vendor.businessAddress} />
        <Row label="City" value={vendor.city} />
        <Row label="Tax ID" value={vendor.taxIdentificationNumber ?? "—"} />
        <Row label="Description" value={vendor.description ?? "—"} />
      </Card>

      <Card title="Trading">
        <Row label="Open right now" value={vendor.isOpenNow ? "Yes" : "No"} />
        <Row label="Accepting orders" value={vendor.isActive ? "Yes" : "No"} />
        <Row
          label="Hours"
          value={
            vendor.openingTime && vendor.closingTime
              ? `${vendor.openingTime} – ${vendor.closingTime}`
              : "Not set"
          }
        />
        <Row
          label="Operating days"
          value={vendor.operatingDays.length > 0 ? vendor.operatingDays.join(", ") : "Not set"}
        />
        <Row label="Delivery fee" value={formatCurrency(vendor.deliveryFee)} />
        <Row label="Minimum order" value={formatCurrency(vendor.minOrder)} />
        <Row label="Delivery time" value={`${vendor.deliveryTimeMin}–${vendor.deliveryTimeMax} min`} />
        <Row
          label="Prep time"
          value={vendor.estimatedPrepTimeMinutes ? `${vendor.estimatedPrepTimeMinutes} min` : "—"}
        />
        <Row
          label="Rating"
          value={vendor.reviewCount > 0 ? `${vendor.rating.toFixed(1)} (${vendor.reviewCount} reviews)` : "No reviews yet"}
        />
      </Card>

      <Card title="Documents">
        {vendor.documentsStatus && documentsStatusMeta[vendor.documentsStatus] && (
          <div className="pb-2">
            <Badge meta={documentsStatusMeta[vendor.documentsStatus]} />
          </div>
        )}
        {vendor.documents.map((document) => (
          <Row
            key={document.type}
            label={vendorDocumentLabels[document.type]}
            value={
              !document.uploaded ? (
                <span className="text-text-muted">Not uploaded</span>
              ) : canViewDocuments ? (
                // The endpoint streams a binary file, so this is a plain link
                // out rather than something fetched as JSON.
                <a
                  href={`/api/vendor-document?vendorId=${vendor.id}&type=${document.type}`}
                  className="text-brand transition duration-150 hover:opacity-80"
                >
                  View document
                </a>
              ) : (
                <span className="text-text-muted">Uploaded</span>
              )
            }
          />
        ))}
        <Row label="Reviewed" value={formatDateTimeOrDash(vendor.documentsReviewedAt)} />
      </Card>

      <Card title="Profile completeness">
        <Row label="Complete" value={vendor.isProfileComplete ? "Yes" : "No"} />
        {vendor.missingProfileFields.length > 0 && (
          <Row label="Missing" value={vendor.missingProfileFields.join(", ")} />
        )}
        <Row
          label="Categories"
          value={vendor.categories.length > 0 ? vendor.categories.join(", ") : "—"}
        />
        <Row
          label="Cuisine types"
          value={vendor.cuisineTypes.length > 0 ? vendor.cuisineTypes.join(", ") : "—"}
        />
      </Card>
    </div>
  );
}

function MenuTab({
  vendor,
  items,
  canUpdate,
}: {
  vendor: VendorDetailModel;
  items: MenuItemRow[];
  canUpdate: boolean;
}) {
  const { notify } = useToast();

  if (items.length === 0) {
    return <EmptyState title="No menu items" description="This vendor has not added anything to their menu yet." />;
  }

  return (
    <TableShell>
      <thead>
        <tr>
          <TableHeadCell>Item</TableHeadCell>
          <TableHeadCell>Category</TableHeadCell>
          <TableHeadCell>Price</TableHeadCell>
          <TableHeadCell>Availability</TableHeadCell>
          {canUpdate && (
            <TableHeadCell>
              <span className="sr-only">Actions</span>
            </TableHeadCell>
          )}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <TableCell className="font-medium">
              {item.name}
              {item.description && (
                <span className="mt-0.5 block text-xs font-normal text-text-muted">{item.description}</span>
              )}
            </TableCell>
            <TableCell className="text-text-secondary">{item.categoryName ?? "—"}</TableCell>
            <TableCell>{formatCurrency(item.price)}</TableCell>
            <TableCell className="text-text-secondary">
              {item.isAvailable ? "On sale" : "Pulled from sale"}
            </TableCell>
            {canUpdate && (
              <TableCell>
                <ActionMenu
                  items={[
                    {
                      label: item.isAvailable ? "Pull from sale" : "Put back on sale",
                      onClick: async () =>
                        notify(await toggleMenuItemAvailabilityAction(vendor.id, item.id)),
                    },
                  ]}
                />
              </TableCell>
            )}
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function PayoutTab({ vendor, payout }: { vendor: VendorDetailModel; payout: VendorPayout | null }) {
  if (!vendor.payoutConfigured) {
    return (
      <EmptyState
        title="No payout details"
        description="This vendor has not set up where their money should go."
      />
    );
  }

  // Without `vendors.payout` only the masked summary from the vendor resource
  // is available — the full account number never reaches this admin.
  if (!payout) {
    return (
      <Card title="Payout (masked)">
        <Row label="Bank" value={vendor.payoutMasked.bankName ?? "—"} />
        <Row label="Account name" value={vendor.payoutMasked.accountName ?? "—"} />
        <Row
          label="Account number"
          value={vendor.payoutMasked.accountNumberLast4 ? `•••• ${vendor.payoutMasked.accountNumberLast4}` : "—"}
        />
        <Row label="Mobile money" value={vendor.payoutMasked.mobileMoneyProvider ?? "—"} />
        <p className="pt-2 text-xs text-text-muted">
          Your role does not include permission to see full payout details.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Payout">
      <Row label="Bank" value={payout.bankName ?? "—"} />
      <Row label="Account name" value={payout.accountName ?? "—"} />
      <Row label="Account number" value={payout.accountNumber ?? "—"} />
      <Row label="Branch code" value={payout.branchCode ?? "—"} />
      <Row label="Mobile money provider" value={payout.mobileMoneyProvider ?? "—"} />
      <Row label="Mobile money number" value={payout.mobileMoneyNumber ?? "—"} />
      <p className="pt-2 text-xs text-text-muted">
        Viewing these details is recorded in the audit log.
      </p>
    </Card>
  );
}

function ActivityTab({ activity }: { activity: ActivityRow[] }) {
  if (activity.length === 0) {
    return (
      <EmptyState
        title="No recorded activity"
        description="Administrator actions against this vendor will appear here."
      />
    );
  }

  return (
    <TableShell>
      <thead>
        <tr>
          <TableHeadCell>Action</TableHeadCell>
          <TableHeadCell>Description</TableHeadCell>
          <TableHeadCell>Administrator</TableHeadCell>
          <TableHeadCell>When</TableHeadCell>
        </tr>
      </thead>
      <tbody>
        {activity.map((entry) => (
          <tr key={entry.id}>
            <TableCell className="font-medium">{entry.actionLabel}</TableCell>
            <TableCell className="text-text-secondary">{entry.description}</TableCell>
            <TableCell className="text-text-secondary">{entry.adminEmail}</TableCell>
            <TableCell className="text-text-secondary">{formatDateTimeOrDash(entry.createdAt)}</TableCell>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <h3 className="break-words text-sm font-semibold text-foreground">{title}</h3>
      <dl className="flex flex-col gap-2">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="break-words text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
