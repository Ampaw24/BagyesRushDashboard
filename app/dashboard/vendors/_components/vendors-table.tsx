"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { Badge } from "../../_components/status-badge";
import { ActionMenu } from "../../_components/action-menu";
import { EmptyState } from "../../_components/empty-state";
import { Pagination } from "../../_components/pagination";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { EditIcon, StarIcon } from "../../_lib/icons";
import { documentsStatusMeta, vendorStateMeta } from "../../_lib/status";
import { formatDate } from "../../_lib/format";
import {
  useVendorStatusActions,
  type VendorActionPermissions,
} from "../../_hooks/use-vendor-status-actions";
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
  /** Sub-pages pin the status/availability in the route, so their filters are hidden. */
  showStatusFilters = true,
}: {
  vendors: VendorRow[];
  pagination: PaginationMeta;
  permissions: VendorActionPermissions;
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
                <VendorRowView key={vendor.id} vendor={vendor} permissions={permissions} />
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
}: {
  vendor: VendorRow;
  permissions: VendorActionPermissions;
}) {
  const router = useRouter();
  const { actions, dialog } = useVendorStatusActions(vendor, permissions);

  return (
    <tr>
      <TableCell className="font-medium">
        <Link href={`/dashboard/vendors/${vendor.id}`} className="hover:text-brand">
          {vendor.businessName}
        </Link>
        {vendor.isFeatured && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-brand">
            <StarIcon className="h-3 w-3" />
            Featured
          </span>
        )}
        <span className="mt-0.5 block text-xs font-normal text-text-muted">{vendor.vendorId}</span>
      </TableCell>
      {/* VendorProfileResource has no owner email or phone — the contact person
          name is the only person field it carries. */}
      <TableCell className="text-text-secondary">{vendor.contactPersonName}</TableCell>
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
            {
              label: "View vendor",
              icon: EditIcon,
              onClick: () => router.push(`/dashboard/vendors/${vendor.id}`),
            },
            ...actions,
          ]}
        />
        {dialog}
      </TableCell>
    </tr>
  );
}
