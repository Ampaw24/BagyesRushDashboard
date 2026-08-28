import type { Permission } from "@/lib/types/enums";
import type { NavCounts } from "@/lib/services/nav-counts.service";

/**
 * `permission` narrows a single child below whatever the section requires.
 *
 * A section can only be gated on one permission, but its children are not
 * always reachable with it: a manager holds `payments.view` and so sees
 * Transactions, while the payout screens need `withdrawals.view`. Without this
 * they saw links that answered with a permission block.
 */
export type NavLeaf = {
  href: string;
  label: string;
  badge?: number;
  permission?: Permission;
};

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
  | "riders"
  | "coupons"
  | "transactions"
  | "users"
  | "support"
  | "communications"
  | "vendors"
  | "catalogue"
  | "reviews"
  | "administration"
  | "settings";

export type NavEntry =
  | { kind: "link"; href: string; label: string; icon: NavIconKey; badge?: number }
  | { kind: "section"; label: string; icon: NavIconKey; children: NavLeaf[] };

/**
 * A nav entry plus the permission needed to reach it. Entries the signed-in
 * admin cannot use are dropped rather than rendered and left to 403 on click.
 *
 * `permission: null` marks an entry every admin can reach.
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
          // Orders no rider accepted. A work queue, so it carries a badge.
          {
            href: "/dashboard/orders/needs-dispatch",
            label: "Needs Dispatch",
            badge: counts.ordersNeedingDispatch,
          },
          { href: "/dashboard/orders/in-transit", label: "In Transit" },
          { href: "/dashboard/orders/delivered", label: "Delivered" },
          { href: "/dashboard/orders/cancelled", label: "Cancelled" },
        ],
      },
    },
    {
      permission: "riders.view",
      entry: {
        kind: "section",
        label: "Riders",
        icon: "riders",
        children: [
          { href: "/dashboard/riders", label: "All Riders" },
          // Completed applications waiting on a decision — a work queue, so it
          // carries the badge.
          { href: "/dashboard/riders/requests", label: "Rider Requests", badge: counts.riderRequests },
          // Registered and never finished onboarding: nothing to review yet, so
          // this is a follow-up list rather than a queue.
          { href: "/dashboard/riders/incomplete", label: "Incomplete Riders" },
          { href: "/dashboard/riders/blocked", label: "Blocked Riders" },
          { href: "/dashboard/riders/rejected", label: "Rejected Riders" },
          { href: "/dashboard/riders/deleted", label: "Deleted Riders" },
        ],
      },
    },
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
          // The reconciliation first: collected, paid out, kept, owed.
          { href: "/dashboard/transactions", label: "Report" },
          // Both sides in one list, filterable — the view for "what has moved
          // lately" without having to pick a side first.
          { href: "/dashboard/transactions/all", label: "All Transactions" },
          { href: "/dashboard/transactions/payments", label: "Customer Payments" },
          { href: "/dashboard/transactions/vendors", label: "Vendor Transactions" },
          { href: "/dashboard/transactions/riders", label: "Rider Transactions" },
          // Riders and vendors share one payout queue; the screen filters by
          // side rather than splitting into two near-identical routes.
          {
            href: "/dashboard/transactions/payouts",
            label: "Payouts",
            permission: "withdrawals.view",
          },
          // Somebody is waiting for their money, so it carries the badge.
          {
            href: "/dashboard/transactions/payout-requests",
            label: "Payout Requests",
            badge: counts.withdrawalRequests,
            permission: "withdrawals.view",
          },
          { href: "/dashboard/transactions/commissions", label: "Commissions Earned" },
          // Nothing refunds automatically, so this is a work queue.
          { href: "/dashboard/transactions/refunds", label: "Refunds" },
        ],
      },
    },
    {
      permission: "customers.view",
      entry: { kind: "link", href: "/dashboard/users", label: "Customers", icon: "users" },
    },
    {
      permission: "reports.view",
      entry: {
        kind: "link",
        href: "/dashboard/support",
        label: "Support",
        icon: "support",
        badge: counts.openReports,
      },
    },
    {
      // Announcements are gone: they were a mock-only concept with no backend
      // and no channel to reach anyone through.
      permission: "communications.view",
      entry: {
        kind: "section",
        label: "Communications",
        icon: "communications",
        children: [
          { href: "/dashboard/communications", label: "Overview" },
          { href: "/dashboard/communications/new", label: "Create Communication" },
          { href: "/dashboard/communications/templates", label: "Templates" },
          {
            href: "/dashboard/communications/scheduled",
            label: "Scheduled",
            badge: counts.scheduledCommunications,
          },
          { href: "/dashboard/communications/history", label: "History" },
        ],
      },
    },
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
          // Where money can be sent. Vendors and riders pick from this rather
          // than typing a bank name, so it has to stay populated.
          { href: "/dashboard/catalogue/payout-providers", label: "Payout Providers" },
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
    {
      // Every rate the platform charges and pays, in one versioned place.
      // Gated on `settings.manage` rather than shown to all admins: it decides
      // what everyone earns, so it sits with the money permissions.
      permission: "settings.manage",
      entry: {
        kind: "link",
        href: "/dashboard/settings/money",
        label: "Money Settings",
        icon: "settings",
      },
    },
  ];

  return guarded
    .filter(({ permission }) => allowed(permission))
    .map(({ entry }) =>
      entry.kind === "section"
        ? { ...entry, children: entry.children.filter((child) => allowed(child.permission ?? null)) }
        : entry,
    )
    // A section whose every child was filtered out is an empty dropdown.
    .filter((entry) => entry.kind !== "section" || entry.children.length > 0);
}
