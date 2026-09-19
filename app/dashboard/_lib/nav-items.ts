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
  /**
   * Optional, because a sub-item without an obvious glyph reads better with
   * none than with a vague one. Where a leaf has a real subject - a map, a
   * wallet, an audit trail - the icon is what makes the list scannable.
   */
  icon?: NavIconKey;
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
  | "chat"
  | "communications"
  | "vendors"
  | "catalogue"
  | "reviews"
  | "administration"
  | "settings"
  | "map"
  | "clock"
  | "check"
  | "cancel"
  | "activity"
  | "archive"
  | "chart"
  | "profileTick"
  | "profileDelete"
  | "trash"
  | "plus"
  | "image"
  | "shield"
  | "coins"
  | "gift"
  | "handshake"
  | "refresh"
  | "eye"
  | "danger"
  | "packageFailed"
  | "bag"
  | "star"
  | "shop"
  | "ticket"
  | "mail"
  | "list";

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
          { href: "/dashboard/orders", label: "All Orders", icon: "list" },
          { href: "/dashboard/orders/pending", label: "Pending", icon: "clock", badge: counts.pendingOrders },
          // Orders no rider accepted. A work queue, so it carries a badge.
          {
            href: "/dashboard/orders/needs-dispatch",
            label: "Needs Dispatch",
            icon: "danger",
            badge: counts.ordersNeedingDispatch,
          },
          // Paid for and the kitchen has not looked. Sits above the two rider
          // queues because it is the earliest point an order can stall: these
          // never reach dispatch at all.
          {
            href: "/dashboard/orders/awaiting-vendor",
            label: "Awaiting Vendor",
            icon: "clock",
            badge: counts.ordersAwaitingVendor,
          },
          // Paid for, the rider gave up at the door, nobody has decided what
          // happens next. A queue, so it carries a badge too.
          {
            href: "/dashboard/orders/failed-deliveries",
            label: "Failed Deliveries",
            icon: "packageFailed",
            badge: counts.failedDeliveries,
          },
          { href: "/dashboard/orders/in-transit", label: "In Transit", icon: "activity" },
          { href: "/dashboard/orders/delivered", label: "Delivered", icon: "check" },
          { href: "/dashboard/orders/cancelled", label: "Cancelled", icon: "cancel" },
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
          { href: "/dashboard/riders", label: "All Riders", icon: "list" },
          // Where everyone is right now, updating over a websocket. Second
          // rather than buried at the bottom: on a busy afternoon it is the
          // screen a dispatcher actually sits on.
          { href: "/dashboard/riders/live", label: "Live Map", icon: "map" },
          // Completed applications waiting on a decision — a work queue, so it
          // carries the badge.
          { href: "/dashboard/riders/requests", label: "Rider Requests", icon: "profileTick", badge: counts.riderRequests },
          // Registered and never finished onboarding: nothing to review yet, so
          // this is a follow-up list rather than a queue.
          { href: "/dashboard/riders/incomplete", label: "Incomplete Riders", icon: "clock" },
          { href: "/dashboard/riders/blocked", label: "Blocked Riders", icon: "shield" },
          { href: "/dashboard/riders/rejected", label: "Rejected Riders", icon: "profileDelete" },
          { href: "/dashboard/riders/deleted", label: "Deleted Riders", icon: "trash" },
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
          { href: "/dashboard/transactions", label: "Report", icon: "chart" },
          // Both sides in one list, filterable — the view for "what has moved
          // lately" without having to pick a side first.
          { href: "/dashboard/transactions/all", label: "All Transactions", icon: "list" },
          { href: "/dashboard/transactions/payments", label: "Customer Payments", icon: "coins" },
          { href: "/dashboard/transactions/vendors", label: "Vendor Transactions", icon: "shop" },
          { href: "/dashboard/transactions/riders", label: "Rider Transactions", icon: "riders" },
          // Riders and vendors share one payout queue; the screen filters by
          // side rather than splitting into two near-identical routes.
          {
            href: "/dashboard/transactions/payouts",
            label: "Payouts",
            icon: "handshake",
            permission: "withdrawals.view",
          },
          // Somebody is waiting for their money, so it carries the badge.
          {
            href: "/dashboard/transactions/payout-requests",
            label: "Payout Requests",
            icon: "clock",
            badge: counts.withdrawalRequests,
            permission: "withdrawals.view",
          },
          { href: "/dashboard/transactions/commissions", label: "Commissions Earned", icon: "coins" },
          // Nothing refunds automatically, so this is a work queue.
          { href: "/dashboard/transactions/refunds", label: "Refunds", icon: "refresh" },
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
      // Its own entry rather than a child of Support, because the two are
      // gated on different permissions: finance holds chat.view so a refund
      // decision can be checked against what was actually said, and holds no
      // reports permission at all. Nesting it would have hidden it from the
      // role most likely to need it.
      permission: "chat.view",
      entry: {
        kind: "link",
        href: "/dashboard/conversations",
        label: "Conversations",
        icon: "chat",
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
          { href: "/dashboard/communications", label: "Overview", icon: "chart" },
          { href: "/dashboard/communications/new", label: "Create Communication", icon: "plus" },
          { href: "/dashboard/communications/templates", label: "Templates", icon: "archive" },
          {
            href: "/dashboard/communications/scheduled",
            label: "Scheduled",
            icon: "clock",
            badge: counts.scheduledCommunications,
          },
          { href: "/dashboard/communications/history", label: "History", icon: "list" },
          // Last: it is a tool for when something is wrong, not part of the
          // everyday flow above it.
          {
            href: "/dashboard/communications/push-diagnostics",
            label: "Push Diagnostics",
            icon: "activity",
          },
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
          { href: "/dashboard/vendors", label: "Overview", icon: "list" },
          { href: "/dashboard/vendors/all", label: "All Vendors", icon: "list" },
          { href: "/dashboard/vendors/pending", label: "Pending Vendors", icon: "clock", badge: counts.pendingVendors },
          { href: "/dashboard/vendors/active", label: "Active Vendors", icon: "check" },
          { href: "/dashboard/vendors/suspended", label: "Suspended Vendors", icon: "shield" },
          { href: "/dashboard/vendors/inactive", label: "Inactive Vendors", icon: "eye" },
          { href: "/dashboard/vendors/applications", label: "Vendor Applications", icon: "profileTick", badge: counts.pendingVendors },
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
          { href: "/dashboard/catalogue/categories", label: "Categories", icon: "bag" },
          { href: "/dashboard/catalogue/business-types", label: "Business Types", icon: "shop" },
          { href: "/dashboard/catalogue/banners", label: "Banners", icon: "image" },
          // Where money can be sent. Vendors and riders pick from this rather
          // than typing a bank name, so it has to stay populated.
          { href: "/dashboard/catalogue/payout-providers", label: "Payout Providers", icon: "handshake" },
      // The fleet. Same permission and the same kind of table as the rest of
      // the catalogue, so it lives here rather than under Riders.
      { href: "/dashboard/catalogue/vehicle-types", label: "Vehicle Types", icon: "list" },
      { href: "/dashboard/catalogue/vehicle-makes", label: "Vehicle Makes", icon: "archive" },
      { href: "/dashboard/catalogue/vehicle-models", label: "Vehicle Models", icon: "activity" },
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
          { href: "/dashboard/admin-users", label: "Admin Users", icon: "users" },
          // "Customers" used to appear here too, duplicating the top-level
          // Users link. It is now only in one place.
          { href: "/dashboard/administration/roles", label: "Roles", icon: "shield" },
          { href: "/dashboard/administration/permissions", label: "Permissions", icon: "shield" },
          { href: "/dashboard/administration/role-changes", label: "Role Changes", icon: "refresh" },
          { href: "/dashboard/administration/audit-logs", label: "Audit Logs", icon: "archive" },
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
        // The URL stays /money so existing links and bookmarks keep working;
        // the page now also carries dispatch and waiting rules, which are
        // published and versioned by the same record.
        label: "System Config - BAGYES",
        icon: "settings",
      },
    },
    {
      // The contract riders sign. Same authority as the rates above: it is a
      // platform-wide policy document, not one rider's record.
      permission: "settings.manage",
      entry: {
        kind: "link",
        href: "/dashboard/settings/rider-agreement",
        label: "Rider Agreement",
        icon: "archive",
      },
    },
    {
      // Refer and earn. Under settings rather than with coupons: this is what
      // the platform pays out, not a discount on what it charges.
      permission: "settings.manage",
      entry: {
        kind: "link",
        href: "/dashboard/settings/referrals",
        label: "Refer & Earn",
        icon: "gift",
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
