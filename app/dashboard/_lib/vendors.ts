import type { BadgeMeta } from "./status";
import type { VendorCategory, VendorStatus, VerificationStatus } from "../_services/vendors-mock-data";

export const vendorStatusMeta: Record<VendorStatus, BadgeMeta> = {
  active: {
    label: "Active",
    dotClassName: "bg-status-good",
    badgeClassName: "bg-status-good/10 text-status-good",
  },
  pending: {
    label: "Pending",
    dotClassName: "bg-status-warning",
    badgeClassName: "bg-status-warning/10 text-amber-700 dark:text-amber-400",
  },
  suspended: {
    label: "Suspended",
    dotClassName: "bg-status-critical",
    badgeClassName: "bg-status-critical/10 text-status-critical",
  },
  inactive: {
    label: "Inactive",
    dotClassName: "bg-zinc-400",
    badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
  },
  archived: {
    label: "Archived",
    dotClassName: "bg-zinc-400",
    badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
  },
};

export const verificationStatusMeta: Record<VerificationStatus, BadgeMeta> = {
  verified: {
    label: "Verified",
    dotClassName: "bg-status-good",
    badgeClassName: "bg-status-good/10 text-status-good",
  },
  pending: {
    label: "Pending review",
    dotClassName: "bg-status-info",
    badgeClassName: "bg-status-info/10 text-status-info",
  },
  requires_review: {
    label: "Requires review",
    dotClassName: "bg-status-warning",
    badgeClassName: "bg-status-warning/10 text-amber-700 dark:text-amber-400",
  },
  rejected: {
    label: "Rejected",
    dotClassName: "bg-status-critical",
    badgeClassName: "bg-status-critical/10 text-status-critical",
  },
};

export const VENDOR_CATEGORIES: VendorCategory[] = ["Restaurant", "Fast Food", "Bakery", "Groceries", "Pharmacy", "Drinks & Beverages"];

export const CATEGORY_COLOR_CLASS: Record<VendorCategory, string> = {
  Restaurant: "bg-brand",
  "Fast Food": "bg-status-info",
  Bakery: "bg-status-warning",
  Groceries: "bg-status-good",
  Pharmacy: "bg-status-critical",
  "Drinks & Beverages": "bg-zinc-400",
};
