import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VendorDetail } from "./_components/vendor-detail";
import { getCustomerById } from "../../_services/mock-data";
import { getVendorById, getVendorMenuItems, getVendorStatusHistory } from "../../_services/vendors-mock-data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const vendor = await getVendorById(id);
  return { title: vendor ? `${vendor.businessName} — Bagyes Rush Delivery` : "Vendor — Bagyes Rush Delivery" };
}

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await getVendorById(id);
  if (!vendor) notFound();

  const [owner, menuItems, statusHistory] = await Promise.all([
    getCustomerById(vendor.ownerUserId),
    getVendorMenuItems(id),
    getVendorStatusHistory(id),
  ]);

  return <VendorDetail vendor={vendor} ownerEmail={owner?.email} menuItems={menuItems} statusHistory={statusHistory} />;
}
