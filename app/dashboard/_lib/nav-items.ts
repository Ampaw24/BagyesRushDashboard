import {
  AnalyticsIcon,
  OrdersIcon,
  OverviewIcon,
  RidersIcon,
  ShieldIcon,
  SettingsIcon,
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
  { kind: "link", href: "/dashboard/analytics", label: "Analytics", icon: AnalyticsIcon },
  { kind: "link", href: "/dashboard/users", label: "Users", icon: UsersIcon },
  { kind: "link", href: "/dashboard/support", label: "Support", icon: SupportIcon, badge: OPEN_SUPPORT_COUNT },
  { kind: "link", href: "/dashboard/admin-users", label: "Admin Users", icon: ShieldIcon },
  { kind: "link", href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];
