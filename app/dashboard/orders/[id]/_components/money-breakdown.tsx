import { formatCurrency } from "../../../_lib/format";
import type { OrderDetail } from "@/lib/mappers/order.mapper";

/**
 * What the customer paid, how the delivery fee got there, and who got what.
 *
 * The point is that every figure is defensible to the person it affects. A
 * vendor asking why they got GHS 81 on a GHS 90 basket, or a rider asking why a
 * 13 km run paid 22.99, should be answerable from this panel without anybody
 * opening a calculator or the settings screen.
 *
 * Everything is read from what the order recorded when it was priced. Changing
 * a rate tomorrow does not restate this order — and where an order predates
 * versioned rates, that is said rather than glossed over.
 */
export function MoneyBreakdown({ order }: { order: OrderDetail }) {
  const { pricing, earnings } = order;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 break-words text-lg font-semibold tracking-tight text-foreground">
        Money
        {pricing && (
          <span className="text-xs font-normal text-text-muted">
            priced under {pricing.settingsName}
            {!pricing.settingsRecorded && " — rates not recorded on this order"}
          </span>
        )}
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="How the delivery fee was built">
          {pricing ? (
            <>
              <Line
                label="Road distance"
                value={`${pricing.distanceKm.toFixed(2)} km`}
                muted
              />
              {pricing.durationMinutes !== null && (
                <Line label="Routed travel" value={`${pricing.durationMinutes} min`} muted />
              )}

              <Divider />

              <Line label="Base fee" value={formatCurrency(pricing.baseFee)} />
              {pricing.freeKm > 0 && (
                <Line
                  label={`First ${pricing.freeKm} km included`}
                  value={formatCurrency(0)}
                  muted
                />
              )}
              <Line
                label={`${pricing.chargeableKm.toFixed(2)} km × ${formatCurrency(pricing.perKm)}`}
                value={formatCurrency(pricing.distanceCharge)}
              />

              {/* A parcel adds a rider-to-pickup leg, a size multiplier and a
                  fragile surcharge on top, which is why the parts below can
                  fall short of the charge. Said plainly rather than leaving a
                  reader to wonder where the difference came from. */}
              {order.isParcel && (
                <p className="pt-1 text-xs text-text-muted">
                  A parcel also carries the rider&rsquo;s leg to the pickup, a size
                  multiplier and any fragile surcharge.
                </p>
              )}

              <Divider />
              <Line label="Delivery fee charged" value={formatCurrency(order.deliveryFee)} strong />
            </>
          ) : (
            <p className="text-xs text-text-muted">
              This order predates the recorded pricing breakdown.
            </p>
          )}
        </Card>

        <Card title="What the customer paid">
          {!order.isParcel && <Line label="Subtotal" value={formatCurrency(order.subtotal)} />}
          {order.discount > 0 && (
            <Line label="Discount" value={`−${formatCurrency(order.discount)}`} />
          )}
          <Line label="Delivery" value={formatCurrency(order.deliveryFee)} />
          <Line
            label={
              pricing
                ? `Service fee (${pricing.serviceFeePercent}%${
                    pricing.serviceFeeFlat > 0 ? ` + ${formatCurrency(pricing.serviceFeeFlat)}` : ""
                  })`
                : "Service fee"
            }
            value={formatCurrency(order.serviceFee)}
          />

          <Divider />
          <Line label="Total" value={formatCurrency(order.total)} strong />
        </Card>

        {/* Each side settles at its own moment: the vendor's share the moment
            the customer pays, the rider's when somebody actually delivers.
            Anything not settled yet says so rather than reading GHS 0.00 —
            "the rider was paid nothing" and "no rider has been paid yet" are
            not the same statement, and the panel used to make them look it. */}
        <Card title="How it was split">
          {earnings ? (
            <>
              {!order.isParcel && (
                <Line
                  label={
                    pricing
                      ? `Vendor (less ${pricing.vendorPercent}% commission)`
                      : "Vendor"
                  }
                  value={money(earnings.vendor)}
                />
              )}
              <Line
                label={pricing ? `Rider (less ${pricing.riderPercent}% commission)` : "Rider"}
                value={money(earnings.rider, "Paid on delivery")}
              />

              <Divider />

              {/* Commission and the service fee are the platform's two takings
                  and they are different things: one is a share of somebody
                  else's earnings, the other is charged to the customer. */}
              <Line
                label={
                  earnings.riderSettled
                    ? "Commission (both sides)"
                    : "Commission (vendor side)"
                }
                value={money(earnings.platform)}
              />
              <Line label="Service fee" value={formatCurrency(earnings.serviceFee)} />
              <Line
                label="Platform keeps"
                value={money(earnings.platformKeeps, "Set when the rider is paid")}
                strong
              />

              {!earnings.riderSettled && (
                <p className="pt-1 text-xs text-text-muted">
                  The platform&rsquo;s share of the {formatCurrency(order.deliveryFee)} delivery
                  is set when a rider is paid, so the total it keeps is not final yet.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-text-muted">
              The split is recorded when the order is delivered.
            </p>
          )}
        </Card>
      </div>
    </section>
  );
}

/**
 * A money figure, or why there isn't one yet.
 *
 * null means "not settled", which is a different thing from zero and has to
 * read differently on the page.
 */
function money(value: number | null, whenUnknown = "Not settled yet"): string {
  return value === null ? whenUnknown : formatCurrency(value);
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <h3 className="break-words text-sm font-semibold text-foreground">{title}</h3>
      <dl className="flex flex-col gap-2 text-sm">{children}</dl>
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
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt
        className={
          strong ? "font-semibold text-foreground" : muted ? "text-text-muted" : "text-text-secondary"
        }
      >
        {label}
      </dt>
      <dd
        className={`tabular-nums ${
          strong ? "font-semibold text-foreground" : "font-medium text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Divider() {
  return <hr className="border-border-subtle" />;
}
