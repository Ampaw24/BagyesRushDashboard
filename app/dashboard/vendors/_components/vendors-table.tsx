"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { Badge } from "../../_components/status-badge";
import { ActionMenu } from "../../_components/action-menu";
import { EmptyState } from "../../_components/empty-state";
import { Pagination } from "../../_components/pagination";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { Avatar } from "../../_components/avatar";
import { EditIcon, EyeIcon, StarIcon } from "../../_lib/icons";
import { ViewVendorDialog } from "./view-vendor-dialog";
import { documentsStatusMeta, vendorStateMeta } from "../../_lib/status";
import { formatDate } from "../../_lib/format";
import {
  useVendorStatusActions,
  type VendorActionPermissions,
} from "../../_hooks/use-vendor-status-actions";
import { useSendMessage } from "../../_hooks/use-send-message";
import type { VendorRow } from "@/lib/mappers/vendor.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import { VENDOR_STATUSES, vendorStatusLabels } from "@/lib/types/enums";

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "All statuses",
  options: VENDOR_STATUSES.map((status) => ({ value: status, label: vendorStatusLabels[status] })),
};

const ACTIVE_FILTER: SelectFilter = {
  key: "is_active",
  label: "Availability",
  allLabel: "Active and inactive",
  options: [
    { value: "1", label: "Active only" },
    { value: "0", label: "Inactive only" },
  ],
};

const TRASHED_FILTER: SelectFilter = {
  key: "with_trashed",
  label: "Deleted",
  allLabel: "Hide deleted",
  options: [{ value: "1", label: "Include deleted" }],
};

export function VendorsTable({
  vendors,
  pagination,
  permissions,
  canMessage,
  canViewDocuments,
  /** Sub-pages pin the status/availability in the route, so their filters are hidden. */
  showStatusFilters = true,
}: {
  vendors: VendorRow[];
  pagination: PaginationMeta;
  permissions: VendorActionPermissions;
  /** `communications.send` — sending SMS spends credits, so it is its own right. */
  canMessage: boolean;
  /** `vendors.documents` — reading who they are, not merely managing them. */
  canViewDocuments: boolean;
  showStatusFilters?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchPlaceholder="Search business name, description or city"
        filters={showStatusFilters ? [STATUS_FILTER, ACTIVE_FILTER, TRASHED_FILTER] : [TRASHED_FILTER]}
      />

      {vendors.length === 0 ? (
        <EmptyState
          title="No vendors match your filters"
          description="Try a different search term or filter."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell>Contact</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>City</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Documents</TableHeadCell>
                <TableHeadCell>Rating</TableHeadCell>
                <TableHeadCell>Joined</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <VendorRowView
                  key={vendor.id}
                  vendor={vendor}
                  permissions={permissions}
                  canMessage={canMessage}
                  canViewDocuments={canViewDocuments}
                />
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}
    </div>
  );
}

function VendorRowView({
  vendor,
  permissions,
  canMessage,
  canViewDocuments,
}: {
  vendor: VendorRow;
  permissions: VendorActionPermissions;
  canMessage: boolean;
  canViewDocuments: boolean;
}) {
  const router = useRouter();
  const { actions, dialog } = useVendorStatusActions(vendor, permissions);
  const { actions: messageActions, dialog: messageDialog } = useSendMessage(
    { userId: vendor.userId, name: vendor.businessName, phone: vendor.phone },
    canMessage,
  );
  const [viewing, setViewing] = useState(false);

  return (
    <tr>
      <TableCell className="font-medium">
        <span className="flex items-center gap-3">
          {/* The logo, which the list has never shown: a kitchen is recognised
              by its mark long before its registered name. Opens the same
              dialog the menu does. */}
          <button
            type="button"
            onClick={() => setViewing(true)}
            aria-label={`View ${vendor.businessName}`}
            className="rounded-xl transition duration-150 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <Avatar
              name={vendor.businessName}
              src={vendor.logoUrl}
              className="h-8 w-8 rounded-xl text-xs"
            />
          </button>
          <span className="min-w-0">
            <Link href={`/dashboard/vendors/${vendor.id}`} className="break-words hover:text-brand">
              {vendor.businessName}
            </Link>
            {vendor.isFeatured && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-brand">
                <StarIcon className="h-3 w-3" />
                Featured
              </span>
            )}
            <span className="mt-0.5 block text-xs font-normal text-text-muted">
              {vendor.vendorId}
            </span>
          </span>
        </span>
      </TableCell>
      <TableCell className="text-text-secondary">
        {vendor.contactPersonName}
        {/* The owner's number, which the resource withheld until the account
            block was added: staff chasing a kitchen that has stopped accepting
            orders need a way to reach them that is not the app. */}
        {vendor.phone && (
          <span className="mt-0.5 block text-xs text-text-muted">{vendor.phone}</span>
        )}
      </TableCell>
      <TableCell className="text-text-secondary">{vendor.businessType ?? "—"}</TableCell>
      <TableCell className="text-text-secondary">{vendor.city}</TableCell>
      <TableCell>
        <Badge meta={vendorStateMeta[vendor.derivedState]} />
      </TableCell>
      <TableCell>
        {vendor.documentsStatus && documentsStatusMeta[vendor.documentsStatus] ? (
          <Badge meta={documentsStatusMeta[vendor.documentsStatus]} />
        ) : (
          <span className="text-sm text-text-secondary">
            {vendor.documentsUploaded}/{vendor.documentsTotal} uploaded
          </span>
        )}
      </TableCell>
      <TableCell className="text-text-secondary">
        {vendor.reviewCount > 0 ? `${vendor.rating.toFixed(1)} (${vendor.reviewCount})` : "—"}
      </TableCell>
      <TableCell className="text-text-secondary">{formatDate(vendor.joinedAt)}</TableCell>
      <TableCell>
        <ActionMenu
          items={[
            // First, and the one an admin wants most of the time: the whole
            // profile without losing the filters and the scroll position this
            // list was left in.
            { label: "Quick view", icon: EyeIcon, onClick: () => setViewing(true) },
            {
              label: "Open full profile",
              icon: EditIcon,
              onClick: () => router.push(`/dashboard/vendors/${vendor.id}`),
            },
            ...messageActions,
            ...actions,
          ]}
        />
        {dialog}
        {messageDialog}
        {viewing && (
          <ViewVendorDialog
            vendor={vendor}
            canViewDocuments={canViewDocuments}
            onClose={() => setViewing(false)}
          />
        )}
      </TableCell>
    </tr>
  );
}
