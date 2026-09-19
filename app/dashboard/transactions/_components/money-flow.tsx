import Link from "next/link";

import { formatCurrency } from "../../_lib/format";
import type { FinanceSummaryDto, PlatformSettingDto } from "@/lib/types/api";

/**
 * How the money actually split, next to the rules that split it.
 *
 * Two halves on purpose. The left is **recorded**: what each order was priced
 * at when it was placed, summed. The right is **live**: the rates in force
 * right now, which govern the next order and no earlier one. Showing only the
 * rates would invite reading them as an explanation of the totals — and the
 * moment somebody edits a percentage, they stop being one.
 */
export function MoneyFlow({
  summary,
  settings,
}: {
  summary: FinanceSummaryDto;
  settings: PlatformSettingDto | null;
}) {
  /*
   * `platform_earnings` is the remainder the backend computed, so these three
   * reconcile with what was collected by construction — there is no arithmetic
   * here that could disagree with the ledger.
   */
  const shareOf = (amount: number) =>
    summary.collected > 0 ? Math.round((amount / summary.collected) * 1000) / 10 : 0;

  /*
   * Money kept that is neither commission nor a service fee: a delivery nobody
   * was paid for, or a promo the platform absorbed. Normally zero, and surfaced
   * rather than folded in — a large figure means orders settled without paying
   * somebody, which an admin should see rather than read as revenue.
   */
  const showsUnallocated = Math.abs(summary.unallocated) >= 0.01;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">
          Where the money goes
        </h2>
        <p className="text-sm text-text-secondary">
          Every delivered order splits three ways. These are the amounts recorded when each order
          was priced.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 rounded-lg bg-surface-muted p-4">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Customers paid
            </span>
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {formatCurrency(summary.collected)}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <FlowRow
              label="Vendors earn"
              sublabel="Food, less commission"
              amount={summary.vendor_earnings}
              percent={shareOf(summary.vendor_earnings)}
              tone="vendor"
            />
            <FlowRow
              label="Riders earn"
              sublabel="Delivery fee, less commission"
              amount={summary.rider_earnings}
              percent={shareOf(summary.rider_earnings)}
              tone="rider"
            />
            <FlowRow
              label="Platform keeps"
              sublabel="Commission on both sides, plus service fees"
              amount={summary.platform_earnings}
              percent={shareOf(summary.platform_earnings)}
              tone="platform"
            />
          </div>

          <dl className="flex flex-col gap-1.5 rounded-lg bg-surface-muted p-4 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              What the platform kept is made of
            </span>
            <PlatformShare term="Commission" value={summary.commission_earned} />
            <PlatformShare term="Service fees" value={summary.service_fees} />
            {showsUnallocated && (
              <PlatformShare
                term="Unallocated"
                value={summary.unallocated}
                hint="Delivery nobody was paid for, or a promo absorbed"
                warn
              />
            )}
            {summary.discounts > 0 && (
              <PlatformShare term="Discounts given" value={-summary.discounts} />
            )}
          </dl>

          <p className="text-xs text-text-muted">
            Vendor + rider + platform always equals what was collected.
          </p>
        </div>

        <RateCard settings={settings} />
      </div>
    </section>
  );
}

function PlatformShare({
  term,
  value,
  hint,
  warn = false,
}: {
  term: string;
  value: number;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={warn ? "text-status-warning" : "text-text-secondary"}>
        {term}
        {hint && <span className="mt-0.5 block text-xs text-text-muted">{hint}</span>}
      </dt>
      <dd
        className={`tabular-nums font-medium ${warn ? "text-status-warning" : "text-foreground"}`}
      >
        {formatCurrency(value)}
      </dd>
    </div>
  );
}

function FlowRow({
  label,
  sublabel,
  amount,
  percent,
  tone,
}: {
  label: string;
  sublabel: string;
  amount: number;
  percent: number;
  tone: "vendor" | "rider" | "platform";
}) {
  const bar = {
    vendor: "bg-brand",
    rider: "bg-status-good",
    platform: "bg-status-info",
  }[tone];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-sm font-semibold text-foreground">
          {formatCurrency(amount)}
          <span className="ml-2 text-xs font-normal text-text-muted">{percent}%</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full ${bar}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="text-xs text-text-muted">{sublabel}</span>
    </div>
  );
}

/**
 * The rules in force. Read-only here — this screen reports, the settings screen
 * decides — but linked, so "why is the platform keeping that?" is one click
 * from the answer.
 */
function RateCard({ settings }: { settings: PlatformSettingDto | null }) {
  if (!settings) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border-subtle p-4">
        <span className="text-sm font-medium text-foreground">Current rates</span>
        <p className="text-xs text-text-muted">
          Only visible to admins who can manage money settings.
        </p>
      </div>
    );
  }

  const percent = (value: number | null) => (value === null ? "—" : `${value}%`);
  const money = (value: number | null) => (value === null ? "—" : formatCurrency(value));

  const serviceFee = [
    settings.service_fee_percent ? `${settings.service_fee_percent}%` : null,
    settings.service_fee_flat ? money(settings.service_fee_flat) : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-subtle p-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">Rates in force</span>
        <span className="text-xs text-text-muted">
          {settings.is_published
            ? `${settings.name} — governs new orders only`
            : "Falling back to config: nothing published yet"}
        </span>
      </div>

      <dl className="flex flex-col gap-2.5 text-sm">
        {/* These are the platform's cut, not what the party keeps —
            PlatformSetting::vendorEarningFor() subtracts them. Labelled
            "Vendor keeps 10%" this said the exact opposite of the truth, and
            contradicted the order screen, which had it right. */}
        <Rate term="Vendor commission" value={percent(settings.vendor_percent)} />
        <Rate term="Rider commission" value={percent(settings.rider_percent)} />
        <Rate term="Parcel rider commission" value={percent(settings.parcel_rider_percent)} />

        <hr className="border-border-subtle" />

        <Rate term="Delivery base" value={money(settings.delivery_base_fee)} />
        <Rate
          term="Per km"
          value={
            settings.delivery_per_km === null
              ? "—"
              : `${money(settings.delivery_per_km)}${
                  settings.delivery_free_km ? ` after ${settings.delivery_free_km} km` : ""
                }`
          }
        />
        <Rate term="Service fee" value={serviceFee.length ? serviceFee.join(" + ") : "—"} />
      </dl>

      <Link
        href="/dashboard/settings/money"
        className="text-sm font-medium text-brand hover:underline"
      >
        Change these rates →
      </Link>
    </div>
  );
}

function Rate({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-text-secondary">{term}</dt>
      <dd className="tabular-nums font-medium text-foreground">{value}</dd>
    </div>
  );
}
