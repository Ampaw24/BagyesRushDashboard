import { useMemo, useState } from "react";
import type { Vendor, VendorCategory, VendorStatus, VerificationStatus } from "../_services/vendors-mock-data";

export type VendorStatusFilter = VendorStatus | "all";
export type VendorVerificationFilter = VerificationStatus | "all";
export type VendorCategoryFilter = VendorCategory | "all";

export function useVendorsFilter(vendors: Vendor[], initialStatus: VendorStatusFilter = "all", initialVerification: VendorVerificationFilter = "all") {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VendorStatusFilter>(initialStatus);
  const [verification, setVerification] = useState<VendorVerificationFilter>(initialVerification);
  const [category, setCategory] = useState<VendorCategoryFilter>("all");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        vendor.businessName.toLowerCase().includes(normalizedQuery) ||
        vendor.id.toLowerCase().includes(normalizedQuery) ||
        vendor.ownerName.toLowerCase().includes(normalizedQuery) ||
        vendor.email.toLowerCase().includes(normalizedQuery) ||
        vendor.phone.includes(normalizedQuery);
      const matchesStatus = status === "all" || vendor.status === status;
      const matchesVerification = verification === "all" || vendor.verificationStatus === verification;
      const matchesCategory = category === "all" || vendor.category === category;
      return matchesQuery && matchesStatus && matchesVerification && matchesCategory;
    });
  }, [vendors, query, status, verification, category]);

  return { query, setQuery, status, setStatus, verification, setVerification, category, setCategory, filtered };
}
