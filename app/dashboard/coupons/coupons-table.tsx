"use client";

import { useState } from "react";

import { ActionMenu } from "../_components/action-menu";
import { Badge } from "../_components/status-badge";
import { ConfirmDialog } from "../_components/confirm-dialog";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { EmptyState } from "../_components/empty-state";
import { Pagination } from "../_components/pagination";
import { FilterBar, type SelectFilter } from "../_components/filter-bar";
import { promoCodeStateMeta } from "../_lib/status";
import { useToast } from "../_components/toast-provider";
import { PlusIcon, RefreshIcon, TrashIcon } from "../_lib/icons";
import { formatCurrency, formatDate } from "../_lib/format";
import { CouponFormDialog } from "./coupon-form-dialog";
import { deletePromoCodeAction, togglePromoCodeStatusAction } from "./_actions";
import { promoCodeState, type PromoCodeRow } from "@/lib/mappers/promo-code.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import { PROMO_CODE_SCOPES, promoCodeScopeLabels } from "@/lib/types/enums";

const SCOPE_FILTER: SelectFilter = {
  key: "scope",
  label: "Scope",
  allLabel: "All scopes",
  options: PROMO_CODE_SCOPES.map((scope) => ({ value: scope, label: promoCodeScopeLabels[scope] })),
};

const ACTIVE_FILTER: SelectFilter = {
  key: "is_active",
  label: "State",
  allLabel: "Active and inactive",
  options: [
    { value: "1", label: "Active only" },
    { value: "0", label: "Inactive only" },
  ],
};

type Dialog =
  | { kind: "form"; coupon: PromoCodeRow | null }
  | { kind: "delete"; coupon: PromoCodeRow }
  | null;

export function CouponsTable({
  coupons,
  pagination,
}: {
  coupons: PromoCodeRow[];
  pagination: PaginationMeta;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const { notify, notifySuccess } = useToast();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar searchPlaceholder="Search code or description" filters={[SCOPE_FILTER, ACTIVE_FILTER]} />
        <button
          type="button"
          onClick={() => setDialog({ kind: "form", coupon: null })}
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
        >
          <PlusIcon className="h-4 w-4" />
          New promo code
        </button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          title="No promo codes match your filters"
          description="Create a code or widen the filters to see more."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Code</TableHeadCell>
                <TableHeadCell>Discount</TableHeadCell>
                <TableHeadCell>Scope</TableHeadCell>
                <TableHeadCell>Min. order</TableHeadCell>
                <TableHeadCell>Redemptions</TableHeadCell>
                <TableHeadCell>Ends</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <TableCell className="font-medium">
                    {coupon.code}
                    {coupon.description && (
                      <span className="mt-0.5 block text-xs font-normal text-text-muted">
                        {coupon.description}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary">{describeDiscount(coupon)}</TableCell>
                  <TableCell className="text-text-secondary">{coupon.scopeLabel}</TableCell>
                  <TableCell className="text-text-secondary">
                    {coupon.minOrderAmount > 0 ? formatCurrency(coupon.minOrderAmount) : "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {coupon.redemptionCount}
                    {coupon.maxRedemptions !== null ? ` / ${coupon.maxRedemptions}` : ""}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {coupon.endsAt ? formatDate(coupon.endsAt) : "No end date"}
                  </TableCell>
                  <TableCell>
                    {/* `is_live` folds in the schedule, so an active-but-future
                        code reads "Scheduled" rather than "Live". */}
                    <Badge meta={promoCodeStateMeta[promoCodeState(coupon)]} />
                  </TableCell>
                  <TableCell>
                    <ActionMenu
                      items={[
                        { label: "Edit", onClick: () => setDialog({ kind: "form", coupon }) },
                        {
                          label: coupon.isActive ? "Deactivate" : "Activate",
                          icon: RefreshIcon,
                          onClick: async () => notify(await togglePromoCodeStatusAction(coupon.id)),
                        },
                        {
                          label: "Delete",
                          icon: TrashIcon,
                          danger: true,
                          onClick: () => setDialog({ kind: "delete", coupon }),
                        },
                      ]}
                    />
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}

      {dialog?.kind === "form" && (
        <CouponFormDialog
          coupon={dialog.coupon}
          onClose={() => setDialog(null)}
          onSaved={() => setDialog(null)}
        />
      )}

      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Delete promo code"
          description={`${dialog.coupon.code} will stop working immediately. Existing redemptions are kept for reporting.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await deletePromoCodeAction(dialog.coupon.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

function describeDiscount(coupon: PromoCodeRow): string {
  if (coupon.type === "free_delivery") return "Free delivery";
  if (coupon.type === "percentage") {
    const cap = coupon.maxDiscount !== null ? ` (max ${formatCurrency(coupon.maxDiscount)})` : "";
    return `${coupon.value}% off${cap}`;
  }
  return `${formatCurrency(coupon.value)} off`;
}
