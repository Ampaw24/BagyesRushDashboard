"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { ActionMenu } from "../../_components/action-menu";
import { Badge } from "../../_components/status-badge";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { EmptyState } from "../../_components/empty-state";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { Pagination } from "../../_components/pagination";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { PlusIcon, TrashIcon } from "../../_lib/icons";
import { formatCurrency, formatDate } from "../../_lib/format";
import { useToast } from "../../_components/toast-provider";
import {
  CheckboxField,
  Field,
  FormDialog,
  inputClass,
} from "../../catalogue/_components/form-dialog";
import { cancelReferralAction, deleteMilestoneAction, saveMilestoneAction } from "./_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { ReferralMilestoneRow, ReferralRow } from "@/lib/mappers/referral.mapper";
import type { ReferralSummaryDto } from "@/lib/types/api";
import type { PaginationMeta } from "@/lib/api/types";

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "All referrals",
  options: [
    { value: "qualified", label: "Earned" },
    { value: "pending", label: "Waiting on first order" },
    { value: "cancelled", label: "Cancelled" },
  ],
};

const STATUS_META = {
  qualified: {
    label: "Earned",
    dotClassName: "bg-status-good",
    badgeClassName: "bg-status-good/10 text-status-good",
  },
  pending: {
    label: "Pending",
    dotClassName: "bg-status-warn",
    badgeClassName: "bg-status-warn/10 text-status-warn",
  },
  cancelled: {
    label: "Cancelled",
    dotClassName: "bg-zinc-400",
    badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
  },
} as const;

type Dialog =
  | { kind: "milestone"; milestone: ReferralMilestoneRow | null }
  | { kind: "delete-milestone"; milestone: ReferralMilestoneRow }
  | { kind: "cancel"; referral: ReferralRow }
  | null;

type Rules = {
  enabled: boolean;
  reward: number;
  refereeBonus: number;
  minimumOrder: number;
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface px-5 py-4 shadow-sm">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

export function ReferralsManager({
  summary,
  milestones,
  referrals,
  pagination,
  rules,
}: {
  summary: ReferralSummaryDto;
  milestones: ReferralMilestoneRow[];
  referrals: ReferralRow[];
  pagination: PaginationMeta;
  rules: Rules;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const { notifySuccess } = useToast();

  return (
    <div className="flex flex-col gap-6">
      {/* Nothing is paid while the programme is off, and that is easy to miss
          when the milestone table below looks fully configured. */}
      {!rules.enabled && (
        <div className="rounded-xl border border-status-warn/30 bg-status-warn/5 px-5 py-4">
          <p className="text-sm font-medium text-foreground">Referral rewards are switched off</p>
          <p className="mt-1 text-sm text-text-secondary">
            Introductions are still recorded — who brought whom is real and worth keeping — but
            nothing below pays out. Turn it on under{" "}
            <Link href="/dashboard/settings/money" className="text-brand underline-offset-2 hover:underline">
              System Config
            </Link>
            .
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Introductions"
          value={summary.total_referrals.toLocaleString()}
          hint={`${summary.pending.toLocaleString()} waiting on a first order`}
        />
        <Stat
          label="Earned"
          value={summary.qualified.toLocaleString()}
          hint="Friend ordered and received it"
        />
        <Stat
          label="Conversion"
          value={`${summary.conversion_rate}%`}
          hint="Invitations are free; only a qualified one is a customer"
        />
        <Stat
          label="Programme cost"
          value={formatCurrency(summary.total_cost)}
          hint={`${formatCurrency(summary.referrer_rewards)} rewards · ${formatCurrency(summary.referee_bonuses)} welcome · ${formatCurrency(summary.milestone_bonuses)} milestones`}
        />
      </section>

      {/* The rates are published with commission, so they are read-only here
          and edited where every other money rule is. */}
      <section className="rounded-xl border border-border-subtle bg-surface px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Current rates</p>
            <p className="mt-1 text-sm text-text-secondary">
              {formatCurrency(rules.reward)} per referral
              {rules.refereeBonus > 0 && <> · {formatCurrency(rules.refereeBonus)} welcome bonus</>}
              {rules.minimumOrder > 0 && <> · minimum order {formatCurrency(rules.minimumOrder)}</>}
            </p>
          </div>
          <Link
            href="/dashboard/settings/money"
            className="flex h-11 shrink-0 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
          >
            Change rates
          </Link>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Rewards land as wallet credit that can be spent on orders and never cashed out.
        </p>
      </section>

      {/* Milestones */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Milestone bonuses</h2>
            <p className="text-sm text-text-secondary">
              A one-off bonus on top of the per-referral reward, paid the first time somebody
              reaches the count.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDialog({ kind: "milestone", milestone: null })}
            className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            <PlusIcon className="h-4 w-4" />
            New milestone
          </button>
        </div>

        {milestones.length === 0 ? (
          <EmptyState
            title="No milestone bonuses"
            description="Referrers earn the per-referral reward only. Add a milestone to reward somebody who keeps going."
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Referrals</TableHeadCell>
                <TableHeadCell>Bonus</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Paid to</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone) => (
                <tr key={milestone.id}>
                  <TableCell className="font-medium">{milestone.referralsRequired}</TableCell>
                  <TableCell className="text-text-secondary">{formatCurrency(milestone.reward)}</TableCell>
                  <TableCell className="text-text-secondary">{milestone.description ?? "—"}</TableCell>
                  <TableCell className="text-text-secondary">
                    {milestone.awardsCount} customer{milestone.awardsCount === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell>
                    <Badge meta={milestone.isActive ? STATUS_META.qualified : STATUS_META.cancelled} />
                  </TableCell>
                  <TableCell>
                    <ActionMenu
                      items={[
                        {
                          label: "Edit",
                          onClick: () => setDialog({ kind: "milestone", milestone }),
                        },
                        {
                          label: "Delete",
                          icon: TrashIcon,
                          danger: true,
                          disabled: milestone.awardsCount > 0,
                          disabledReason:
                            "Customers have been paid this. Deactivate it instead — deleting would leave credits with nothing explaining them.",
                          onClick: () => setDialog({ kind: "delete-milestone", milestone }),
                        },
                      ]}
                    />
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </section>

      {/* Top referrers */}
      {summary.top_referrers.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Top referrers</h2>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Customer</TableHeadCell>
                <TableHeadCell>Earned referrals</TableHeadCell>
                <TableHeadCell>Paid</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {summary.top_referrers.map((row) => (
                <tr key={row.customer_id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-text-secondary">{row.qualified_count}</TableCell>
                  <TableCell className="text-text-secondary">{formatCurrency(row.earned)}</TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>
      )}

      {/* Every introduction */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">All referrals</h2>
        <FilterBar searchPlaceholder="Search name or code" filters={[STATUS_FILTER]} />

        {referrals.length === 0 ? (
          <EmptyState
            title="No referrals match your filters"
            description="Nobody has signed up with a code yet, or the filters are too narrow."
          />
        ) : (
          <>
            <TableShell>
              <thead>
                <tr>
                  <TableHeadCell>Referrer</TableHeadCell>
                  <TableHeadCell>Friend</TableHeadCell>
                  <TableHeadCell>Code</TableHeadCell>
                  <TableHeadCell>Qualifying order</TableHeadCell>
                  <TableHeadCell>Reward</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Joined</TableHeadCell>
                  <TableHeadCell>
                    <span className="sr-only">Actions</span>
                  </TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id}>
                    <TableCell className="font-medium">{referral.referrerName}</TableCell>
                    <TableCell className="text-text-secondary">{referral.refereeName}</TableCell>
                    <TableCell className="text-text-secondary">{referral.code}</TableCell>
                    <TableCell className="text-text-secondary">{referral.orderNumber ?? "—"}</TableCell>
                    <TableCell className="text-text-secondary">
                      {referral.reward !== null ? formatCurrency(referral.reward) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge meta={STATUS_META[referral.status]} />
                    </TableCell>
                    <TableCell className="text-text-secondary">{formatDate(referral.joinedAt)}</TableCell>
                    <TableCell>
                      <ActionMenu
                        items={[
                          {
                            label: "Cancel",
                            icon: TrashIcon,
                            danger: true,
                            disabled: referral.status !== "pending",
                            disabledReason:
                              referral.status === "qualified"
                                ? "This has been paid. Cancelling would leave the credit with nothing explaining it."
                                : "Already cancelled.",
                            onClick: () => setDialog({ kind: "cancel", referral }),
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
      </section>

      {dialog?.kind === "milestone" && (
        <MilestoneForm milestone={dialog.milestone} onClose={() => setDialog(null)} />
      )}

      {dialog?.kind === "delete-milestone" && (
        <ConfirmDialog
          title="Delete milestone"
          description={`The bonus at ${dialog.milestone.referralsRequired} referrals will be removed. Nobody has been paid it.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await deleteMilestoneAction(dialog.milestone.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}

      {dialog?.kind === "cancel" && (
        <ConfirmDialog
          title="Cancel this referral"
          description={`${dialog.referral.referrerName} will not be paid for introducing ${dialog.referral.refereeName}. Use this when the two are the same person, or the friend has gone.`}
          confirmLabel="Cancel referral"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await cancelReferralAction(dialog.referral.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

function MilestoneForm({
  milestone,
  onClose,
}: {
  milestone: ReferralMilestoneRow | null;
  onClose: () => void;
}) {
  const { notifySuccess } = useToast();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const description = String(form.get("description") ?? "").trim();

    setPending(true);
    setMessage("");
    setErrors({});

    const result = await saveMilestoneAction(milestone?.id ?? null, {
      referrals_required: Number(form.get("referrals_required")),
      reward: Number(form.get("reward")),
      description: description === "" ? null : description,
      is_active: form.get("is_active") !== null,
    });

    setPending(false);
    notifySuccess(result);

    if (result.ok) {
      onClose();
      return;
    }

    setMessage(result.message);
    setErrors(result.errors);
  }

  return (
    <FormDialog
      title={milestone ? `Edit milestone at ${milestone.referralsRequired}` : "New milestone bonus"}
      submitLabel={milestone ? "Save changes" : "Create milestone"}
      pending={pending}
      message={message}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <Field
        label="Referrals needed"
        error={fieldError(errors, "referrals_required")}
        hint="Counted on referrals that have actually earned — not signups."
      >
        <input
          name="referrals_required"
          type="number"
          min={1}
          required
          defaultValue={milestone?.referralsRequired ?? ""}
          className={inputClass}
        />
      </Field>

      <Field
        label="Bonus"
        error={fieldError(errors, "reward")}
        hint="Paid once, on top of the per-referral reward, the first time they reach the count."
      >
        <input
          name="reward"
          type="number"
          min={0.01}
          step={0.01}
          required
          defaultValue={milestone?.reward ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Description" error={fieldError(errors, "description")}>
        <input
          name="description"
          maxLength={255}
          placeholder="Ten friends"
          defaultValue={milestone?.description ?? ""}
          className={inputClass}
        />
      </Field>

      <CheckboxField name="is_active" label="Active" defaultChecked={milestone?.isActive ?? true} />
    </FormDialog>
  );
}
