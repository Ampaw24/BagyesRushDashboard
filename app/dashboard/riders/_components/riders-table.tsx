"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { Avatar } from "../../_components/avatar";
import { Badge, RiderPresenceBadge } from "../../_components/status-badge";
import { ActionMenu } from "../../_components/action-menu";
import { EmptyState } from "../../_components/empty-state";
import { Pagination } from "../../_components/pagination";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { EditIcon, EyeIcon, StarIcon } from "../../_lib/icons";
import { ViewRiderDialog } from "./view-rider-dialog";
import { documentsStatusMeta, riderStateMeta } from "../../_lib/status";
import { formatCurrency, formatDate } from "../../_lib/format";
import {
  useRiderStatusActions,
  type RiderActionPermissions,
} from "../../_hooks/use-rider-status-actions";
import { useSendMessage } from "../../_hooks/use-send-message";
import type { RiderRow } from "@/lib/mappers/rider.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import { RIDER_STATUSES, riderStatusLabels } from "@/lib/types/enums";

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "All statuses",
  options: RIDER_STATUSES.map((status) => ({ value: status, label: riderStatusLabels[status] })),
};

const ONLINE_FILTER: SelectFilter = {
  key: "is_online",
  label: "Presence",
  allLabel: "Online and offline",
  options: [
    { value: "1", label: "Online only" },
    { value: "0", label: "Offline only" },
  ],
};

/**
 * Paperwork that has run out, or is about to.
 *
 * Not a status: a rider with lapsed insurance is still "approved", they simply
 * cannot switch on. Before this the only way to find them was to open profiles
 * one at a time, so thirty riders renewing in March was thirty clicks.
 */
const CREDENTIAL_FILTER: SelectFilter = {
  key: "credential_state",
  label: "Paperwork",
  allLabel: "Any paperwork",
  options: [
    { value: "expired", label: "Expired — cannot go online" },
    { value: "expiring", label: "Expiring soon" },
  ],
};

export function RidersTable({
  riders,
  pagination,
  permissions,
  canMessage,
  canViewDocuments,
  /** Sub-pages pin the status in the route, so their status filter is hidden. */
  showStatusFilters = true,
}: {
  riders: RiderRow[];
  pagination: PaginationMeta;
  permissions: RiderActionPermissions;
  /** `communications.send` — sending SMS spends credits, so it is its own right. */
  canMessage: boolean;
  /** `riders.documents` — reading who somebody is, not merely managing them. */
  canViewDocuments: boolean;
  showStatusFilters?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchPlaceholder="Search name, phone, plate or rider code"
        filters={
          showStatusFilters
            ? [STATUS_FILTER, ONLINE_FILTER, CREDENTIAL_FILTER]
            : [ONLINE_FILTER, CREDENTIAL_FILTER]
        }
      />

      {riders.length === 0 ? (
        <EmptyState
          title="No riders match your filters"
          description="Try a different search term or filter."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Rider</TableHeadCell>
                <TableHeadCell>Phone</TableHeadCell>
                <TableHeadCell>Vehicle</TableHeadCell>
                <TableHeadCell>City</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Presence</TableHeadCell>
                <TableHeadCell>Documents</TableHeadCell>
                <TableHeadCell>Deliveries</TableHeadCell>
                <TableHeadCell>Wallet</TableHeadCell>
                <TableHeadCell>Joined</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {riders.map((rider) => (
                <RiderRowView
                  key={rider.id}
                  rider={rider}
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

function RiderRowView({
  rider,
  permissions,
  canMessage,
  canViewDocuments,
}: {
  rider: RiderRow;
  permissions: RiderActionPermissions;
  canMessage: boolean;
  canViewDocuments: boolean;
}) {
  const router = useRouter();
  const { actions, dialog } = useRiderStatusActions(rider, permissions);
  const { actions: messageActions, dialog: messageDialog } = useSendMessage(
    { userId: rider.userId, name: rider.name, phone: rider.phone },
    canMessage,
  );
  const [viewing, setViewing] = useState(false);

  return (
    <tr>
      <TableCell className="font-medium">
        <span className="flex items-center gap-3">
          {/* Opens the same dialog the menu does. The face is what an admin
              scanning a list actually aims at, and a photo too small to judge
              is precisely what they are trying to enlarge. */}
          <button
            type="button"
            onClick={() => setViewing(true)}
            aria-label={`View ${rider.name}`}
            className="rounded-full transition duration-150 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <Avatar name={rider.name} src={rider.photoUrl} className="h-8 w-8 text-xs" />
          </button>
          <span className="min-w-0">
            <Link href={`/dashboard/riders/${rider.id}`} className="break-words hover:text-brand">
              {rider.name}
            </Link>
            <span className="mt-0.5 block text-xs font-normal text-text-muted">
              {rider.riderCode}
            </span>
          </span>
        </span>
      </TableCell>
      <TableCell className="text-text-secondary">{rider.phone ?? "—"}</TableCell>
      <TableCell className="text-text-secondary">
        {rider.vehicleTypeLabel ?? "—"}
        {rider.plateNumber && (
          <span className="mt-0.5 block text-xs text-text-muted">{rider.plateNumber}</span>
        )}
      </TableCell>
      <TableCell className="text-text-secondary">{rider.city ?? "—"}</TableCell>
      <TableCell>
        <Badge meta={riderStateMeta[rider.derivedState]} />
      </TableCell>
      <TableCell>
        <RiderPresenceBadge online={rider.isOnline} />
      </TableCell>
      <TableCell>
        {rider.documentsStatus && documentsStatusMeta[rider.documentsStatus] ? (
          <Badge meta={documentsStatusMeta[rider.documentsStatus]} />
        ) : (
          <span className="text-sm text-text-secondary">
            {rider.hasAllDocuments ? "Complete" : "Incomplete"}
          </span>
        )}
      </TableCell>
      <TableCell className="text-text-secondary">
        {rider.deliveriesCompleted.toLocaleString()}
        {rider.reviewCount > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-text-muted">
            <StarIcon className="h-3 w-3 text-status-warning" />
            {rider.rating.toFixed(1)}
          </span>
        )}
      </TableCell>
      <TableCell>
        {/* Here so an admin can see who is owed money without opening six
            profiles. Lifetime earnings sit under it for context: a large
            balance on a rider who has earned little is a payout not yet made. */}
        <span className="flex flex-col gap-0.5">
          <span className="tabular-nums text-foreground">{formatCurrency(rider.walletBalance)}</span>
          {rider.lifetimeEarned > 0 && (
            <span className="text-xs text-text-muted">
              {formatCurrency(rider.lifetimeEarned)} earned
            </span>
          )}
        </span>
      </TableCell>
      <TableCell className="text-text-secondary">{formatDate(rider.joinedAt)}</TableCell>
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
              onClick: () => router.push(`/dashboard/riders/${rider.id}`),
            },
            ...messageActions,
            ...actions,
          ]}
        />
        {dialog}
        {messageDialog}
        {viewing && (
          <ViewRiderDialog
            rider={rider}
            canViewDocuments={canViewDocuments}
            onClose={() => setViewing(false)}
          />
        )}
      </TableCell>
    </tr>
  );
}
