import {
  BLOCKED_RIDER_COUNT,
  DELETE_REQUEST_COUNT,
  INCOMPLETE_RIDER_COUNT,
  OPEN_SUPPORT_COUNT,
  RIDER_REQUEST_COUNT,
  WITHDRAWAL_REQUEST_COUNT,
} from "../_services/mock-data";
import { SCHEDULED_COMMUNICATIONS_COUNT } from "../_services/communications-mock-data";
import type { Permission } from "@/lib/types/enums";
import type { NavCounts } from "@/lib/services/nav-counts.service";

export type NavLeaf = { href: string; label: string; badge?: number };

/**
 * Icons travel as keys, not components.
 *
 * The tree is built on the server and handed to the `"use client"` nav, and a
 * function cannot cross that boundary — React refuses to serialize it. The
 * client resolves the key against its own icon map instead.
 */
export type NavIconKey =
  | "overview"
  | "orders"
  // | "riders"
  | "coupons"
  | "transactions"
  | "users"
  // | "support"
  // | "communications"
  | "vendors"
  | "catalogue"
  | "reviews"
  | "administration"
  // | "settings";

export type NavEntry =
  | { kind: "link"; href: string; label: string; icon: NavIconKey; badge?: number }
  | { kind: "section"; label: string; icon: NavIconKey; children: NavLeaf[] };

/**
 * A nav entry plus the permission needed to reach it. Entries the signed-in
 * admin cannot use are dropped rather than rendered and left to 403 on click.
 *
 * `permission: null` marks the modules that have no backend yet (Riders,
 * Support, Communications, Settings) — they still run on mock data, so there is
 * no permission to check.
 */
type GuardedEntry = { entry: NavEntry; permission: Permission | null };

export type BuildNavTreeInput = {
  counts: NavCounts;
  permissions: readonly Permission[];
};

/**
 * Builds the sidebar for one request.
 *
 * This used to be a module-level `NAV_TREE` const whose badge counts were read
 * from the mock services at import time — which meant they were frozen into the
 * client bundle. Badges now come from the API via the dashboard layout.
 */
export function buildNavTree({ counts, permissions }: BuildNavTreeInput): NavEntry[] {
  const allowed = (permission: Permission | null) =>
    permission === null || permissions.includes(permission);

  const guarded: GuardedEntry[] = [
    {
      permission: "dashboard.view",
      entry: { kind: "link", href: "/dashboard", label: "Overview", icon: "overview" },
    },
    {
      permission: "orders.view",
      entry: {
        kind: "section",
        label: "Orders",
        icon: "orders",
        children: [
          { href: "/dashboard/orders", label: "All Orders" },
          { href: "/dashboard/orders/pending", label: "Pending", badge: counts.pendingOrders },
          { href: "/dashboard/orders/in-transit", label: "In Transit" },
          { href: "/dashboard/orders/delivered", label: "Delivered" },
          { href: "/dashboard/orders/cancelled", label: "Cancelled" },
        ],
      },
    },
    // {
    //   // No rider management endpoints exist yet — this module still runs on
    //   // mock data, so its badges stay mock too.
    //   permission: null,
    //   entry: {
    //     kind: "section",
    //     label: "Riders",
    //     icon: "riders",
    //     children: [
    //       { href: "/dashboard/riders", label: "All Riders" },
    //       { href: "/dashboard/riders/requests", label: "Rider Requests", badge: RIDER_REQUEST_COUNT },
    //       { href: "/dashboard/riders/incomplete", label: "Incomplete Riders", badge: INCOMPLETE_RIDER_COUNT },
    //       { href: "/dashboard/riders/blocked", label: "Blocked Riders", badge: BLOCKED_RIDER_COUNT },
    //       { href: "/dashboard/riders/delete-requests", label: "Delete Requests", badge: DELETE_REQUEST_COUNT },
    //     ],
    //   },
    // },
    {
      permission: "promos.manage",
      entry: { kind: "link", href: "/dashboard/coupons", label: "Coupons", icon: "coupons" },
    },
    {
      permission: "payments.view",
      entry: {
        kind: "section",
        label: "Transactions",
        icon: "transactions",
        children: [
          { href: "/dashboard/transactions", label: "All Transactions" },
          // The four below have no backing endpoint (the API models customer
          // payments, not a vendor wallet) and remain on mock data.
          // { href: "/dashboard/transactions/earnings", label: "Earnings" },
          // { href: "/dashboard/transactions/deposits", label: "Deposits" },
          // { href: "/dashboard/transactions/withdrawals", label: "Withdrawals" },
          // { href: "/dashboard/transactions/withdrawal-requests", label: "Withdrawal Requests", badge: WITHDRAWAL_REQUEST_COUNT },
        ],
      },
    },
    {
      permission: "customers.view",
      entry: { kind: "link", href: "/dashboard/users", label: "Customers", icon: "users" },
    },
    // {
    //   permission: null,
    //   entry: { kind: "link", href: "/dashboard/support", label: "Support", icon: "support", badge: OPEN_SUPPORT_COUNT },
    // },
    // {
    //   permission: null,
    //   entry: {
    //     kind: "section",
    //     label: "Communications",
    //     icon: "communications",
    //     children: [
    //       { href: "/dashboard/communications", label: "Overview" },
    //       { href: "/dashboard/communications/new", label: "Create Communication" },
    //       { href: "/dashboard/communications/announcements", label: "Announcements" },
    //       { href: "/dashboard/communications/templates", label: "Templates" },
    //       { href: "/dashboard/communications/scheduled", label: "Scheduled", badge: SCHEDULED_COMMUNICATIONS_COUNT },
    //       { href: "/dashboard/communications/history", label: "History" },
    //     ],
    //   },
    // },
    {
      permission: "vendors.view",
      entry: {
        kind: "section",
        label: "Vendors",
        icon: "vendors",
        children: [
          { href: "/dashboard/vendors", label: "Overview" },
          { href: "/dashboard/vendors/all", label: "All Vendors" },
          { href: "/dashboard/vendors/pending", label: "Pending Vendors", badge: counts.pendingVendors },
          { href: "/dashboard/vendors/active", label: "Active Vendors" },
          { href: "/dashboard/vendors/suspended", label: "Suspended Vendors" },
          { href: "/dashboard/vendors/inactive", label: "Inactive Vendors" },
          { href: "/dashboard/vendors/applications", label: "Vendor Applications", badge: counts.pendingVendors },
        ],
      },
    },
    {
      // Categories, business types and banners all sit behind one permission.
      permission: "catalogue.manage",
      entry: {
        kind: "section",
        label: "Catalogue",
        icon: "catalogue",
        children: [
          { href: "/dashboard/catalogue/categories", label: "Categories" },
          { href: "/dashboard/catalogue/business-types", label: "Business Types" },
          { href: "/dashboard/catalogue/banners", label: "Banners" },
        ],
      },
    },
    {
      permission: "reviews.view",
      entry: { kind: "link", href: "/dashboard/reviews", label: "Reviews", icon: "reviews" },
    },
    {
      permission: "users.view",
      entry: {
        kind: "section",
        label: "Administration",
        icon: "administration",
        children: [
          { href: "/dashboard/admin-users", label: "Admin Users" },
          // "Customers" used to appear here too, duplicating the top-level
          // Users link. It is now only in one place.
          { href: "/dashboard/administration/roles", label: "Roles" },
          { href: "/dashboard/administration/permissions", label: "Permissions" },
          { href: "/dashboard/administration/role-changes", label: "Role Changes" },
          { href: "/dashboard/administration/audit-logs", label: "Audit Logs" },
        ],
      },
    },
    // {
    //   permission: null,
    //   entry: { kind: "link", href: "/dashboard/settings", label: "Settings", icon: "settings" },
    // },
  ];

  return guarded.filter(({ permission }) => allowed(permission)).map(({ entry }) => entry);
}
