import type { Metadata } from "next";
import { PageHeader } from "../_components/page-header";
import { Badge } from "../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { couponStatusMeta } from "../_lib/status";
import { formatCurrency, formatDate } from "../_lib/format";
import { getCoupons } from "../_services/mock-data";

export const metadata: Metadata = {
  title: "Coupons — Bagyes Rush Delivery",
};

export default async function CouponsPage() {
  const coupons = await getCoupons();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Coupons" description="Discount codes available to customers at checkout." />

      <TableShell>
        <thead>
          <tr>
            <TableHeadCell>Code</TableHeadCell>
            <TableHeadCell>Discount</TableHeadCell>
            <TableHeadCell>Usage</TableHeadCell>
            <TableHeadCell>Expires</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon) => (
            <tr key={coupon.id}>
              <TableCell className="font-medium">{coupon.code}</TableCell>
              <TableCell className="text-text-secondary">
                {coupon.discountType === "percent" ? `${coupon.discountValue}% off` : `${formatCurrency(coupon.discountValue)} off`}
              </TableCell>
              <TableCell className="text-text-secondary">
                {coupon.usedCount} / {coupon.usageLimit}
              </TableCell>
              <TableCell className="text-text-secondary">{formatDate(coupon.expiresAt)}</TableCell>
              <TableCell>
                <Badge meta={couponStatusMeta[coupon.status]} />
              </TableCell>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}
