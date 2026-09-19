"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { useToast } from "../../../_components/toast-provider";
import { ConfirmDialog } from "../../../_components/confirm-dialog";
import { formatCurrency, formatDateTime } from "../../../_lib/format";
import { Badge } from "../../../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../../../_components/table-shell";
import { previewSettingsAction, publishSettingsAction } from "../_actions";
import type { PlatformSettingDto, SettingsPreviewDto } from "@/lib/types/api";

const FIELD =
  "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground outline-none transition duration-150 focus:border-brand";
const LABEL = "text-xs font-medium uppercase tracking-wide text-text-muted";

/** Every editable number, as the string the input holds. */
type Draft = Record<string, string> & { name: string };

const NUMERIC_FIELDS = [
  "delivery_base_fee",
  "delivery_free_km",
  "delivery_per_km",
  "delivery_max_km",
  "parcel_base_fee",
  "parcel_per_km",
  "parcel_pickup_per_km",
  "parcel_per_stop_fee",
  "parcel_fragile_surcharge",
  "service_fee_percent",
  "service_fee_flat",
  "service_fee_cap",
  "vendor_percent",
  "rider_percent",
  "parcel_rider_percent",
  "rider_minimum",
  "rider_minimum_withdrawal",
  "vendor_minimum_withdrawal",
  "customer_minimum_withdrawal",
  // Not money, but published and versioned alongside it: these decide who gets
  // offered a job and how long a rider waits at the door.
  "dispatch_radius_km",
  "dispatch_radius_step",
  "dispatch_max_radius_km",
  "dispatch_batch_size",
  "dispatch_offer_ttl_seconds",
  "dispatch_max_rounds",
  "dispatch_location_max_age_minutes",
  "parcel_max_rider_distance_km",
  "rider_max_radius_km",
  "rider_max_concurrent_jobs",
  "referral_reward",
  "referral_referee_bonus",
  "referral_minimum_order",
  "customer_wait_minutes",
  "arrival_radius_metres",
] as const;

/**
 * Published and versioned exactly like the numbers, but a switch rather than a
 * figure — so it needs its own list, its own control and its own line in the
 * payload.
 */
const BOOLEAN_FIELDS = ["customer_withdrawals_enabled", "referral_enabled"] as const;

/**
 * A ready-to-publish name for a version derived from an existing one.
 *
 * The name is required by the API and the form starts from an existing rule, so
 * leaving it blank meant an admin could change a figure and then find Publish
 * greyed out with no obvious reason — the field is far below the numbers they
 * were editing.
 *
 * Dated rather than copied verbatim, because the whole point of naming a
 * version is a readable history: four rows all called "Standard rates" is the
 * same as four rows called nothing. Any previous suffix is stripped first, so
 * editing repeatedly re-dates the name instead of growing a trail of them.
 */
function nameFor(setting: PlatformSettingDto): string {
  const base = setting.name.replace(/\s+·\s+\d{1,2}\s+\w{3}\s+\d{4}$/, "").trim();

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${base} · ${today}`.slice(0, 120);
}

function draftFrom(current: PlatformSettingDto): Draft {
  const draft = { name: nameFor(current) } as Draft;

  for (const key of NUMERIC_FIELDS) {
    const value = current[key as keyof PlatformSettingDto];
    draft[key] = value === null || value === undefined ? "" : String(value);
  }

  for (const key of BOOLEAN_FIELDS) {
    // Carried as a string like everything else in the draft, so one shape
    // covers the whole form. Off unless the published value says otherwise.
    draft[key] = current[key as keyof PlatformSettingDto] ? "1" : "";
  }

  return draft;
}

/**
 * Every money rule on the platform, and what it does to a real order.
 *
 * The point of this screen is not the form — it is the panel beside it. An
 * admin setting a commission needs to see where each cedi of a GHS 80 order
 * ends up, because "10%" on its own does not answer "so what does the vendor
 * get". The breakdown is priced by the backend using the same code that runs at
 * checkout, so what is approved here is what a customer is charged.
 *
 * Publishing replaces rather than edits. Past orders keep what they charged and
 * paid, which is why the history below it is worth reading.
 */
export function MoneySettingsEditor({
  current,
  history,
}: {
  current: PlatformSettingDto;
  history: PlatformSettingDto[];
}) {
  const { notify } = useToast();

  // Which version the form is currently showing. Editing starts from the table
  // below: pick a rule, its numbers fill the fields, change what you need and
  // save. Defaults to whatever is live.
  const sources = [current, ...history.filter((s) => s.id !== current.id)];
  const [sourceId, setSourceId] = useState<number | null>(current.id);
  const source = sources.find((s) => s.id === sourceId) ?? current;
  const formRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState<Draft>(() => draftFrom(current));
  const [samples, setSamples] = useState<SettingsPreviewDto["samples"]>([]);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [, startTransition] = useTransition();

  /**
   * Load a version's numbers into the form, keeping the name the admin typed.
   *
   * The table is below the form, so this scrolls back up - otherwise clicking
   * Edit looks like it did nothing.
   */
  const loadVersion = (id: number | null) => {
    const picked = sources.find((s) => s.id === id) ?? current;

    setSourceId(id);
    setDraft(draftFrom(picked));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const payload = () => {
    const numbers: Record<string, number | null> = {};

    for (const key of NUMERIC_FIELDS) {
      const raw = draft[key]?.trim() ?? "";
      numbers[key] = raw === "" ? null : Number(raw);
    }

    const flags: Record<string, boolean> = {};

    for (const key of BOOLEAN_FIELDS) {
      flags[key] = draft[key] === "1";
    }

    return { name: draft.name.trim() || "Untitled", ...numbers, ...flags };
  };

  // Repriced as the numbers change, so the effect is visible before saving.
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      // Inside a transition: a Server Action that redirects on an expired
      // session cannot be applied by the client outside one.
      startTransition(async () => {
        const result = await previewSettingsAction(payload());
        if (cancelled) return;

        if (result.ok) {
          setSamples(result.data.samples);
          setError("");
        } else {
          setSamples([]);
          setError(result.message);
        }
      });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const field = (key: string, label: string, hint?: string, suffix = "GHS") => (
    <label key={key} className="flex flex-col gap-1.5">
      <span className={LABEL}>{label}</span>
      <div className="relative">
        <input
          value={draft[key] ?? ""}
          onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
          inputMode="decimal"
          className={FIELD}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
          {suffix}
        </span>
      </div>
      {hint && <span className="text-xs text-text-muted">{hint}</span>}
    </label>
  );

  const toggle = (key: string, label: string, hint: string) => (
    <label key={key} className="flex cursor-pointer gap-3 sm:col-span-2">
      <input
        type="checkbox"
        checked={draft[key] === "1"}
        onChange={(event) => setDraft({ ...draft, [key]: event.target.checked ? "1" : "" })}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
      />
      <span className="text-sm">
        <span className="block font-medium text-foreground">{label}</span>
        <span className="block text-xs text-text-muted">{hint}</span>
      </span>
    </label>
  );

  const section = (title: string, blurb: string, children: React.ReactNode) => (
    <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-text-muted">{blurb}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );

  const dirty =
    NUMERIC_FIELDS.some((key) => {
      const was = source[key as keyof PlatformSettingDto];
      return (draft[key] ?? "").trim() !== (was === null || was === undefined ? "" : String(was));
    }) ||
    BOOLEAN_FIELDS.some(
      (key) => (draft[key] === "1") !== Boolean(source[key as keyof PlatformSettingDto]),
    );

  return (
    <div className="flex flex-col gap-6">
      {/* Which rule is on the bench. Without this the form is a set of numbers
          with no stated provenance the moment you edit anything but the live
          one. */}
      <div
        ref={formRef}
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-muted px-5 py-3"
      >
        <span className="text-sm text-text-secondary">
          Editing <strong className="text-foreground">{source.name}</strong>
          {source.is_active ? " (live now)" : source.is_published ? " (retired)" : " (platform defaults)"}
          {dirty && <span className="ml-2 text-brand">· edited</span>}
        </span>

        {dirty && (
          <button
            type="button"
            onClick={() => loadVersion(sourceId)}
            className="text-xs font-medium text-text-muted underline underline-offset-4 transition duration-150 hover:text-foreground"
          >
            Discard changes
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <div className="flex flex-col gap-6">
        {section(
          "What the platform keeps",
          "A percentage of each side. The rest is what they take home.",
          <>
            {field("vendor_percent", "Vendor commission", "Off the food, after any discount.", "%")}
            {field("rider_percent", "Rider commission", "Off the delivery fee.", "%")}
            {field("parcel_rider_percent", "Parcel rider commission", "Parcels can differ.", "%")}
            {field(
              "rider_minimum",
              "Rider floor per delivery",
              "The least a rider earns however short the trip. 0 disables it.",
            )}
          </>,
        )}

        {section(
          "What a customer pays to have food delivered",
          "Base fee, plus a rate for every kilometre past the free allowance.",
          <>
            {field("delivery_base_fee", "Base fee", "Charged on every delivery.")}
            {field("delivery_free_km", "Free kilometres", "Covered by the base fee.", "km")}
            {field("delivery_per_km", "Per kilometre", "Beyond the free allowance.")}
            {field("delivery_max_km", "Maximum distance", "Nothing is delivered beyond this.", "km")}
          </>,
        )}

        {section(
          "Parcels",
          "A parcel is a two-leg job: the rider goes to the pickup, then on to each drop.",
          <>
            {field("parcel_base_fee", "Base fee")}
            {field("parcel_per_km", "Per kilometre", "Pickup to drop-off.")}
            {field("parcel_pickup_per_km", "Rider-to-pickup per km", "The leg food orders do not have.")}
            {field("parcel_per_stop_fee", "Per extra stop", "Parking, finding the door, waiting.")}
            {field(
              "parcel_fragile_surcharge",
              "Fragile surcharge",
              "Charged once on a run carrying anything fragile, however many stops.",
            )}
          </>,
        )}

        {section(
          "Service fee",
          "What the customer pays on top. Taken on the discounted food, so a promotion reduces it too.",
          <>
            {field("service_fee_percent", "Percentage", "Of the food subtotal.", "%")}
            {field("service_fee_flat", "Flat amount", "Added to the percentage.")}
            {field("service_fee_cap", "Cap", "0 means uncapped.")}
          </>,
        )}

        {section(
          "Payout floors",
          "The least somebody may withdraw. Riders cash out often; vendors settle in larger amounts.",
          <>
            {field("rider_minimum_withdrawal", "Rider minimum")}
            {field("vendor_minimum_withdrawal", "Vendor minimum")}
            {field("customer_minimum_withdrawal", "Customer minimum")}
          </>,
        )}

        {section(
          "Customer wallets",
          "Wallet credit can always be spent on the next order. This decides whether it can also be cashed out.",
          <>
            {toggle(
              "customer_withdrawals_enabled",
              "Let customers cash out to mobile money",
              "Payouts go only to the customer's verified phone number, and only from refunded payments — never goodwill credit. Every request still needs your approval.",
            )}
          </>,
        )}

        {section(
          "Refer and earn",
          "What a customer is paid for bringing a friend. The reward lands as wallet credit that can be spent on orders and never cashed out — money the platform gives away must not become money that can be walked out of it. Milestone bonuses are set on the Refer & Earn screen.",
          <>
            {toggle(
              "referral_enabled",
              "Pay referral rewards",
              "Off still records who brought whom — the relationship is real and worth keeping — it just never becomes money.",
            )}
            {field(
              "referral_reward",
              "Per referral",
              "Paid to the referrer once their friend's first order is delivered and paid for. A signup on its own earns nothing: a burner SIM and a fresh email is a complete signup.",
            )}
            {field(
              "referral_referee_bonus",
              "Welcome bonus",
              "Paid to the new customer on the same event. Set it to 0 to reward only the referrer.",
            )}
            {field(
              "referral_minimum_order",
              "Minimum qualifying order",
              "The smallest order that can earn a referral, judged on the food after any discount. Without a floor, a GHS 2 order mints a full reward.",
            )}
          </>,
        )}

        {section(
          "Finding a rider",
          "How far the net is cast when a job goes out, and how it widens when nobody answers. Raise the radius on a quiet afternoon; lower it when riders are complaining about long trips to a pickup.",
          <>
            {field(
              "dispatch_radius_km",
              "First search radius",
              "Measured from the pickup — the kitchen, or the parcel's collection point.",
              "km",
            )}
            {field(
              "dispatch_radius_step",
              "Widen by",
              "Each unanswered round multiplies the radius by this. 1 never widens.",
              "×",
            )}
            {field("dispatch_max_radius_km", "Never search beyond", "The outer limit, however many rounds.", "km")}
            {field(
              "dispatch_batch_size",
              "Riders per round",
              "Offering to everyone at once wastes the nearest rider; one at a time makes a slow rider everybody's problem.",
              "riders",
            )}
            {field(
              "dispatch_offer_ttl_seconds",
              "Time to answer",
              "Long enough to read at a junction, short enough that a pocketed phone does not hold an order.",
              "sec",
            )}
            {field("dispatch_max_rounds", "Rounds before escalating", "Then it lands in the dispatch queue for a human.", "rounds")}
            {field(
              "dispatch_location_max_age_minutes",
              "Ignore positions older than",
              "A rider whose last fix is staler than this counts as having no known location.",
              "min",
            )}
            {field(
              "parcel_max_rider_distance_km",
              "Parcel rider radius",
              "Parcels are quoted per rider rather than broadcast in rings, so they use one radius.",
              "km",
            )}
            {field(
              "rider_max_radius_km",
              "Default rider radius",
              "How far a rider is sent when they have set no preference of their own. A rider who has chosen a radius keeps theirs; this reaches everybody who has not.",
              "km",
            )}
            {field(
              "rider_max_concurrent_jobs",
              "Jobs per rider at once",
              "Ops policy rather than a rider preference, which is why no rider-facing screen sets it. Raising a single trusted rider above this is a separate, per-rider override.",
              "jobs",
            )}
          </>,
        )}

        {section(
          "Waiting at the door",
          "When a rider reaches the customer they mark themselves arrived, the customer is told, and this clock starts. The radius is what stops that being claimable from the road.",
          <>
            {field(
              "customer_wait_minutes",
              "How long a rider waits",
              "After this they may leave. Nothing cancels automatically — it goes to an admin.",
              "min",
            )}
            {field(
              "arrival_radius_metres",
              "Counts as arrived within",
              "Checked against the rider's own live position. Below 250m starts rejecting genuine arrivals — a phone fix in dense Accra is routinely 50–150m out.",
              "m",
            )}
          </>,
        )}

        <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Name this version</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="e.g. February rates"
              maxLength={120}
              className={FIELD}
            />
            <span className="text-xs text-text-muted">
              Filled in for you — change it to whatever makes the history readable
              (&ldquo;Fuel increase&rdquo;, &ldquo;March rates&rdquo;). Publishing makes these
              numbers live and retires <strong>{current.name}</strong>. Orders already placed keep
              what they charged and paid.
            </span>
          </label>

          {error && <p className="text-xs text-status-critical">{error}</p>}

          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={draft.name.trim().length === 0 || samples.length === 0}
            className="flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            Publish these settings
          </button>
        </section>
      </div>

      {/* Where every cedi goes. This is the part that answers "so what does the
          vendor actually get" — a percentage on its own does not. */}
      <aside className="flex h-fit flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm xl:sticky xl:top-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-foreground">Where the money goes</h2>
          <p className="text-xs text-text-muted">
            Four real orders, priced by the backend with the same code that runs at checkout.
          </p>
        </div>

        {samples.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            {error ? "Fix the numbers to see the effect." : "Pricing…"}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {samples.map((sample) => (
              <div key={sample.label} className="flex flex-col gap-2 rounded-lg border border-border-subtle p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{sample.label}</span>
                  <span className="text-xs text-text-muted">
                    {formatCurrency(sample.basket)} basket · {sample.distance_km} km
                  </span>
                </div>

                <dl className="flex flex-col gap-1 text-sm">
                  <Line label="Food" value={sample.basket} muted />
                  <Line label="Delivery" value={sample.delivery_fee} muted />
                  <Line label="Service fee" value={sample.service_fee} muted />
                  <div className="my-1 border-t border-border-subtle" />
                  <Line label="Customer pays" value={sample.customer_pays} strong />
                </dl>

                <dl className="flex flex-col gap-1 border-t border-border-subtle pt-2 text-sm">
                  <Line label="Vendor gets" value={sample.vendor_earns} />
                  <Line label="Rider gets" value={sample.rider_earns} />
                  <Line label="Platform keeps" value={sample.platform_earns} strong />
                </dl>

                {sample.platform_earns < 0 && (
                  <p className="rounded bg-status-warning/10 p-2 text-xs text-status-warning">
                    This order pays out more than it collects.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>

      </div>

      {history.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-foreground">History</h2>
            <p className="text-xs text-text-muted">
              Every version, and how many orders were priced under it. Retired rather than deleted,
              because those orders still point at them. Edit loads a version into the form above —
              saving publishes it as a new version rather than rewriting the old one.
            </p>
          </div>

          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Version</TableHeadCell>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell>Rider</TableHeadCell>
                <TableHeadCell>Delivery</TableHeadCell>
                <TableHeadCell>Orders</TableHeadCell>
                <TableHeadCell>In force from</TableHeadCell>
                <TableHeadCell>Published by</TableHeadCell>
                <TableHeadCell>{""}</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {history.map((setting) => (
                <tr
                  key={setting.id}
                  className={`transition duration-150 hover:bg-surface-muted ${
                    setting.id === sourceId ? "bg-surface-muted" : ""
                  }`}
                >
                  <TableCell>
                    <span className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">{setting.name}</span>
                      {setting.is_active ? (
                        <Badge
                          meta={{
                            label: "Live",
                            dotClassName: "bg-status-good",
                            badgeClassName: "bg-status-good/10 text-status-good",
                          }}
                        />
                      ) : (
                        <span className="text-xs text-text-muted">
                          Retired{" "}
                          {setting.retired_at ? formatDateTime(new Date(setting.retired_at)) : "—"}
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">{setting.vendor_percent}%</TableCell>
                  <TableCell className="tabular-nums">{setting.rider_percent}%</TableCell>
                  <TableCell className="tabular-nums text-text-secondary">
                    {formatCurrency(setting.delivery_base_fee ?? 0)} +{" "}
                    {formatCurrency(setting.delivery_per_km ?? 0)}/km
                  </TableCell>
                  <TableCell className="tabular-nums text-text-secondary">
                    {(setting.orders_count ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {setting.effective_from
                      ? formatDateTime(new Date(setting.effective_from))
                      : "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {setting.published_by ?? "—"}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => loadVersion(setting.id)}
                      className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition duration-150 hover:border-brand hover:text-brand"
                    >
                      {setting.id === sourceId ? "Reload" : "Edit"}
                    </button>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>
      )}

      {confirming && (
        <ConfirmDialog
          title={`Publish "${draft.name.trim()}"?`}
          description="Orders placed from now on are priced and paid at these rates. Orders already placed keep what they charged, and the current version is kept in the history."
          confirmLabel="Publish"
          onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            const result = await publishSettingsAction(payload());
            notify(result);

            if (result.ok) {
              setConfirming(false);
              // Re-derived, not blanked: a blank name is a disabled Publish
              // button on the very next edit.
              setDraft({ ...draft, name: nameFor({ ...source, name: draft.name }) });
            }

            return { ok: result.ok, message: result.message };
          }}
        />
      )}
    </div>
  );
}

function Line({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: number;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={muted ? "text-text-muted" : "text-text-secondary"}>{label}</dt>
      <dd
        className={`tabular-nums ${strong ? "font-semibold text-foreground" : muted ? "text-text-muted" : "text-foreground"}`}
      >
        {formatCurrency(value)}
      </dd>
    </div>
  );
}
