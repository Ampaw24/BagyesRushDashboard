import {
  MegaphoneIcon,
  OrdersIcon,
  OverviewIcon,
  RidersIcon,
  SecuritySafeIcon,
  SettingsIcon,
  ShopIcon,
  SupportIcon,
  TicketIcon,
  UsersIcon,
  WalletIcon,
  type IconComponent,
} from "./icons";
import {
  BLOCKED_RIDER_COUNT,
  DELETE_REQUEST_COUNT,
  INCOMPLETE_RIDER_COUNT,
  OPEN_SUPPORT_COUNT,
  RIDER_REQUEST_COUNT,
  WITHDRAWAL_REQUEST_COUNT,
} from "../_services/mock-data";
import { SCHEDULED_COMMUNICATIONS_COUNT } from "../_services/communications-mock-data";
import { PENDING_VENDOR_APPLICATIONS_COUNT } from "../_services/vendors-mock-data";

export type NavLeaf = { href: string; label: string; badge?: number };

export type NavEntry =
  | { kind: "link"; href: string; label: string; icon: IconComponent; badge?: number }
  | { kind: "section"; label: string; icon: IconComponent; children: NavLeaf[] };

export const NAV_TREE: NavEntry[] = [
  { kind: "link", href: "/dashboard", label: "Overview", icon: OverviewIcon },
  {
    kind: "section",
    label: "Orders",
    icon: OrdersIcon,
    children: [
      { href: "/dashboard/orders", label: "All Orders" },
      { href: "/dashboard/orders/pending", label: "Pending" },
      { href: "/dashboard/orders/in-transit", label: "In Transit" },
      { href: "/dashboard/orders/delivered", label: "Delivered" },
      { href: "/dashboard/orders/cancelled", label: "Cancelled" },
    ],
  },
  {
    kind: "section",
    label: "Riders",
    icon: RidersIcon,
    children: [
      { href: "/dashboard/riders", label: "All Riders" },
      { href: "/dashboard/riders/requests", label: "Rider Requests", badge: RIDER_REQUEST_COUNT },
      { href: "/dashboard/riders/incomplete", label: "Incomplete Riders", badge: INCOMPLETE_RIDER_COUNT },
      { href: "/dashboard/riders/blocked", label: "Blocked Riders", badge: BLOCKED_RIDER_COUNT },
      { href: "/dashboard/riders/delete-requests", label: "Delete Requests", badge: DELETE_REQUEST_COUNT },
    ],
  },
  { kind: "link", href: "/dashboard/coupons", label: "Coupons", icon: TicketIcon },
  {
    kind: "section",
    label: "Transactions",
    icon: WalletIcon,
    children: [
      { href: "/dashboard/transactions", label: "All Transactions" },
      { href: "/dashboard/transactions/earnings", label: "Earnings" },
      { href: "/dashboard/transactions/deposits", label: "Deposits" },
      { href: "/dashboard/transactions/withdrawals", label: "Withdrawals" },
      { href: "/dashboard/transactions/withdrawal-requests", label: "Withdrawal Requests", badge: WITHDRAWAL_REQUEST_COUNT },
    ],
  },
  { kind: "link", href: "/dashboard/users", label: "Users", icon: UsersIcon },
  { kind: "link", href: "/dashboard/support", label: "Support", icon: SupportIcon, badge: OPEN_SUPPORT_COUNT },
  {
    kind: "section",
    label: "Communications",
    icon: MegaphoneIcon,
    children: [
      { href: "/dashboard/communications", label: "Overview" },
      { href: "/dashboard/communications/new", label: "Create Communication" },
      { href: "/dashboard/communications/announcements", label: "Announcements" },
      { href: "/dashboard/communications/templates", label: "Templates" },
      { href: "/dashboard/communications/scheduled", label: "Scheduled", badge: SCHEDULED_COMMUNICATIONS_COUNT },
      { href: "/dashboard/communications/history", label: "History" },
    ],
  },
  {
    kind: "section",
    label: "Vendors",
    icon: ShopIcon,
    children: [
      { href: "/dashboard/vendors", label: "Overview" },
      { href: "/dashboard/vendors/all", label: "All Vendors" },
      { href: "/dashboard/vendors/pending", label: "Pending Vendors" },
      { href: "/dashboard/vendors/active", label: "Active Vendors" },
      { href: "/dashboard/vendors/suspended", label: "Suspended Vendors" },
      { href: "/dashboard/vendors/inactive", label: "Inactive Vendors" },
      { href: "/dashboard/vendors/applications", label: "Vendor Applications", badge: PENDING_VENDOR_APPLICATIONS_COUNT },
    ],
  },
  {
    kind: "section",
    label: "Administration",
    icon: SecuritySafeIcon,
    children: [
      { href: "/dashboard/admin-users", label: "Admin Users" },
      { href: "/dashboard/users", label: "Customers" },
      { href: "/dashboard/administration/roles", label: "Roles" },
      { href: "/dashboard/administration/permissions", label: "Permissions" },
      { href: "/dashboard/administration/role-changes", label: "Role Changes" },
      { href: "/dashboard/administration/audit-logs", label: "Audit Logs" },
    ],
  },
  { kind: "link", href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];
