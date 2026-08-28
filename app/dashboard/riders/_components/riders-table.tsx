"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { Badge, RiderPresenceBadge } from "../../_components/status-badge";
import { ActionMenu } from "../../_components/action-menu";
import { EmptyState } from "../../_components/empty-state";
import { Pagination } from "../../_components/pagination";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { EditIcon, StarIcon } from "../../_lib/icons";
import { documentsStatusMeta, riderStateMeta } from "../../_lib/status";
import { formatCurrency, formatDate } from "../../_lib/format";
import {
  useRiderStatusActions,
  type RiderActionPermissions,
} from "../../_hooks/use-rider-status-actions";
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

export function RidersTable({
  riders,
  pagination,
  permissions,
  /** Sub-pages pin the status in the route, so their status filter is hidden. */
  showStatusFilters = true,
}: {
  riders: RiderRow[];
  pagination: PaginationMeta;
  permissions: RiderActionPermissions;
  showStatusFilters?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchPlaceholder="Search name, phone, plate or rider code"
        filters={
          showStatusFilters
            ? [STATUS_FILTER, ONLINE_FILTER]
            : [ONLINE_FILTER]
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
                <RiderRowView key={rider.id} rider={rider} permissions={permissions} />
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
}: {
  rider: RiderRow;
  permissions: RiderActionPermissions;
}) {
  const router = useRouter();
  const { actions, dialog } = useRiderStatusActions(rider, permissions);

  return (
    <tr>
      <TableCell className="font-medium">
        <span className="flex items-center gap-3">
          <Initials name={rider.name} photoUrl={rider.photoUrl} />
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
            {
              label: "View rider",
              icon: EditIcon,
              onClick: () => router.push(`/dashboard/riders/${rider.id}`),
            },
            ...actions,
          ]}
        />
        {dialog}
      </TableCell>
    </tr>
  );
}

/**
 * A rider's photo is the one image of them that is public, but it is only
 * uploaded partway through onboarding — so initials have to carry the rows that
 * do not have one yet.
 */
function Initials({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
      {initials || "?"}
    </span>
  );
}
