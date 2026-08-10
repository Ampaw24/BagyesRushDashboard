import type { OrderStatus, RiderStatus } from "../_lib/status";

// Deterministic PRNG (mulberry32) so mock numbers are stable across server
// render and client hydration — no Math.random() drift.
export function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Order = {
  id: string;
  customer: string;
  address: string;
  status: OrderStatus;
  items: number;
  total: number;
  rider: string | null;
  placedAt: Date;
};

export type Rider = {
  id: string;
  name: string;
  phone: string;
  status: RiderStatus;
  rating: number;
  activeOrders: number;
  completedToday: number;
};

export type RiderApplication = {
  id: string;
  name: string;
  phone: string;
  vehicleType: "Bike" | "Motorcycle" | "Van";
  city: string;
  submittedAt: Date;
};

export type IncompleteRider = {
  id: string;
  name: string;
  phone: string;
  missingSteps: string[];
  startedAt: Date;
};

export type BlockedRider = {
  id: string;
  name: string;
  phone: string;
  reason: string;
  blockedAt: Date;
};

export type RiderDeleteRequest = {
  id: string;
  name: string;
  phone: string;
  reason: string;
  requestedAt: Date;
};

export type TransactionType = "earning" | "deposit" | "withdrawal";
export type TransactionStatus = "completed" | "pending" | "failed";
export type Transaction = {
  id: string;
  type: TransactionType;
  party: string;
  amount: number;
  status: TransactionStatus;
  date: Date;
};

export type CouponStatus = "active" | "scheduled" | "expired";
export type Coupon = {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  usageLimit: number;
  usedCount: number;
  expiresAt: Date;
  status: CouponStatus;
};

export type CustomerStatus = "active" | "suspended";
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  joinedAt: Date;
  status: CustomerStatus;
};

export type TicketStatus = "open" | "pending" | "resolved";
export type TicketPriority = "low" | "medium" | "high";
export type SupportTicket = {
  id: string;
  customer: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  updatedAt: Date;
};

export type AdminRole = "super_admin" | "admin" | "support_staff";
export type AdminStatus = "active" | "invited" | "suspended" | "removed";
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  lastActive: Date;
};

export type OverviewStats = {
  activeDeliveries: { value: number; deltaPercent: number; trend: number[] };
  ridersOnline: { value: number; deltaPercent: number; trend: number[] };
  revenueToday: { value: number; deltaPercent: number; trend: number[] };
  completionRate: { value: number };
};

export type DayPoint = { date: string; value: number };
export type StatusCount = { status: OrderStatus; count: number };

const NOW = new Date("2026-08-07T17:30:00");

const CUSTOMER_NAMES = [
  "Ada Obi", "Femi Alade", "Chinwe Nnamdi", "Tunde Bakare", "Ngozi Eze",
  "Kunle Afolabi", "Amaka Chukwu", "Segun Adewale", "Ifeoma Uche", "Bayo Ogundele",
  "Zainab Bello", "Emeka Umeh", "Yemi Adeyemi", "Chidera Okeke", "Musa Danjuma",
  "Halima Sani", "Tobi Ojo", "Grace Nwosu", "Aliyu Garba", "Blessing Etim",
];

const STREETS = [
  "Allen Avenue, Ikeja", "Adeola Odeku St, VI", "Awolowo Rd, Ikoyi",
  "Herbert Macaulay Way", "Admiralty Way, Lekki", "Opebi Rd, Ikeja",
  "Ozumba Mbadiwe Ave", "Adetokunbo Ademola St", "Bode Thomas St, Surulere",
  "Ligali Ayorinde St",
];

const RIDER_NAMES = [
  "Chuka Okafor", "Ibrahim Yusuf", "Peter Nwachukwu", "Samuel Effiong",
  "Daniel Okonkwo", "Victor Etim", "Ahmed Lawal", "Joseph Adeoye",
  "Michael Bassey", "David Okoro",
];

const APPLICANT_NAMES = [
  "Ola Fashina", "Ruth Danladi", "Kelechi Onu", "Suleiman Bako", "Precious Nkem",
  "Godwin Attah",
];

const INCOMPLETE_NAMES = ["Uche Nnaji", "Fatima Musa", "Chidi Obasi", "Rebecca James", "Simeon Ude"];
const BLOCKED_NAMES = ["Tayo Salako", "Ifedayo Coker"];
const DELETE_REQUEST_NAMES = ["Nnamdi Uzoma", "Esther Bassey"];

const ADMIN_NAMES = [
  "Chioma Nwadike", "Bashir Umar", "Funmilayo Ade", "Tochukwu Igwe", "Patience Okoli",
];

const rand = mulberry32(42);
const ORDER_STATUSES: OrderStatus[] = ["pending", "in_transit", "delivered", "cancelled"];

function buildOrders(): Order[] {
  return CUSTOMER_NAMES.map((customer, i) => {
    const statusRoll = rand();
    const status: OrderStatus =
      statusRoll < 0.15 ? "pending" : statusRoll < 0.45 ? "in_transit" : statusRoll < 0.9 ? "delivered" : "cancelled";
    const minutesAgo = Math.floor(rand() * 60 * 30);
    return {
      id: `BR-${(2400 + i).toString()}`,
      customer,
      address: STREETS[i % STREETS.length],
      status,
      items: 1 + Math.floor(rand() * 5),
      total: 2500 + Math.floor(rand() * 18000),
      rider: status === "pending" ? null : RIDER_NAMES[i % RIDER_NAMES.length],
      placedAt: new Date(NOW.getTime() - minutesAgo * 60 * 1000),
    };
  });
}

function buildRiders(): Rider[] {
  return RIDER_NAMES.map((name, i) => {
    const statusRoll = rand();
    const status: RiderStatus = statusRoll < 0.4 ? "available" : statusRoll < 0.8 ? "on_delivery" : "offline";
    return {
      id: `RD-${(100 + i).toString()}`,
      name,
      phone: `+234 80${Math.floor(10000000 + rand() * 89999999)}`,
      status,
      rating: Math.round((4 + rand()) * 10) / 10,
      activeOrders: status === "on_delivery" ? 1 + Math.floor(rand() * 3) : 0,
      completedToday: Math.floor(rand() * 14),
    };
  });
}

function buildRiderApplications(): RiderApplication[] {
  const vehicles: RiderApplication["vehicleType"][] = ["Bike", "Motorcycle", "Van"];
  const cities = ["Lagos", "Abuja", "Ibadan", "Port Harcourt"];
  return APPLICANT_NAMES.map((name, i) => ({
    id: `RQ-${(300 + i).toString()}`,
    name,
    phone: `+234 81${Math.floor(10000000 + rand() * 89999999)}`,
    vehicleType: vehicles[i % vehicles.length],
    city: cities[i % cities.length],
    submittedAt: new Date(NOW.getTime() - Math.floor(rand() * 5 * 24 * 60) * 60 * 1000),
  }));
}

function buildIncompleteRiders(): IncompleteRider[] {
  const steps = ["Government ID", "Vehicle papers", "Bank details", "Profile photo", "Guarantor form"];
  return INCOMPLETE_NAMES.map((name, i) => ({
    id: `IC-${(400 + i).toString()}`,
    name,
    phone: `+234 90${Math.floor(10000000 + rand() * 89999999)}`,
    missingSteps: steps.filter(() => rand() < 0.5).slice(0, 1 + Math.floor(rand() * 2)),
    startedAt: new Date(NOW.getTime() - Math.floor(rand() * 10 * 24 * 60) * 60 * 1000),
  }));
}

function buildBlockedRiders(): BlockedRider[] {
  const reasons = ["Repeated late deliveries", "Customer complaints"];
  return BLOCKED_NAMES.map((name, i) => ({
    id: `BL-${(500 + i).toString()}`,
    name,
    phone: `+234 70${Math.floor(10000000 + rand() * 89999999)}`,
    reason: reasons[i % reasons.length],
    blockedAt: new Date(NOW.getTime() - Math.floor(rand() * 20 * 24 * 60) * 60 * 1000),
  }));
}

function buildDeleteRequests(): RiderDeleteRequest[] {
  const reasons = ["Switching to another platform", "No longer riding"];
  return DELETE_REQUEST_NAMES.map((name, i) => ({
    id: `DR-${(600 + i).toString()}`,
    name,
    phone: `+234 91${Math.floor(10000000 + rand() * 89999999)}`,
    reason: reasons[i % reasons.length],
    requestedAt: new Date(NOW.getTime() - Math.floor(rand() * 7 * 24 * 60) * 60 * 1000),
  }));
}

function buildTransactions(): Transaction[] {
  const entries: { type: TransactionType; count: number; statusBias: TransactionStatus[] }[] = [
    { type: "earning", count: 14, statusBias: ["completed"] },
    { type: "deposit", count: 8, statusBias: ["completed", "completed", "pending"] },
    { type: "withdrawal", count: 9, statusBias: ["completed", "completed", "pending", "failed"] },
  ];
  const parties = [...RIDER_NAMES, ...CUSTOMER_NAMES];
  const txns: Transaction[] = [];
  let counter = 0;
  for (const entry of entries) {
    for (let i = 0; i < entry.count; i++) {
      counter += 1;
      const status = entry.statusBias[Math.floor(rand() * entry.statusBias.length)];
      txns.push({
        id: `TX-${(1000 + counter).toString()}`,
        type: entry.type,
        party: parties[counter % parties.length],
        amount: entry.type === "earning" ? 1500 + Math.floor(rand() * 8000) : 5000 + Math.floor(rand() * 60000),
        status,
        date: new Date(NOW.getTime() - Math.floor(rand() * 14 * 24 * 60) * 60 * 1000),
      });
    }
  }
  return txns.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function buildCoupons(): Coupon[] {
  const codes = [
    { code: "RUSH10", type: "percent" as const, value: 10, status: "active" as const },
    { code: "WELCOME500", type: "fixed" as const, value: 500, status: "active" as const },
    { code: "FREESHIP", type: "fixed" as const, value: 800, status: "active" as const },
    { code: "RUSH25", type: "percent" as const, value: 25, status: "scheduled" as const },
    { code: "VIP15", type: "percent" as const, value: 15, status: "active" as const },
    { code: "EASTER2026", type: "fixed" as const, value: 1000, status: "expired" as const },
    { code: "LAUNCH20", type: "percent" as const, value: 20, status: "expired" as const },
  ];
  return codes.map((c, i) => ({
    id: `CP-${(700 + i).toString()}`,
    code: c.code,
    discountType: c.type,
    discountValue: c.value,
    usageLimit: 100 + Math.floor(rand() * 400),
    usedCount: Math.floor(rand() * 100),
    expiresAt: new Date(NOW.getTime() + (c.status === "expired" ? -1 : 1) * (5 + Math.floor(rand() * 40)) * 24 * 60 * 60 * 1000),
    status: c.status,
  }));
}

function buildCustomers(): Customer[] {
  return CUSTOMER_NAMES.map((name, i) => {
    const ordersCount = 1 + Math.floor(rand() * 40);
    return {
      id: `CU-${(800 + i).toString()}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      phone: `+234 80${Math.floor(10000000 + rand() * 89999999)}`,
      ordersCount,
      totalSpent: ordersCount * (2500 + Math.floor(rand() * 6000)),
      joinedAt: new Date(NOW.getTime() - Math.floor(rand() * 300) * 24 * 60 * 60 * 1000),
      status: rand() < 0.92 ? "active" : "suspended",
    };
  });
}

function buildSupportTickets(): SupportTicket[] {
  const subjects = [
    "Order arrived late", "Wrong items delivered", "Refund not received", "Rider was rude",
    "App keeps crashing", "Coupon not applying", "Can't update payment method", "Missing item in order",
  ];
  const statuses: TicketStatus[] = ["open", "open", "pending", "pending", "resolved", "resolved", "resolved", "resolved"];
  const priorities: TicketPriority[] = ["high", "medium", "low"];
  return subjects.map((subject, i) => ({
    id: `TK-${(900 + i).toString()}`,
    customer: CUSTOMER_NAMES[i % CUSTOMER_NAMES.length],
    subject,
    status: statuses[i % statuses.length],
    priority: priorities[Math.floor(rand() * priorities.length)],
    updatedAt: new Date(NOW.getTime() - Math.floor(rand() * 5 * 24 * 60) * 60 * 1000),
  }));
}

function buildAdminUsers(): AdminUser[] {
  const roles: AdminRole[] = ["super_admin", "admin", "admin", "support_staff", "support_staff"];
  return ADMIN_NAMES.map((name, i) => ({
    id: `AD-${(100 + i).toString()}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@bagyesrush.com`,
    role: roles[i % roles.length],
    status: i === ADMIN_NAMES.length - 1 ? "invited" : "active",
    lastActive: new Date(NOW.getTime() - Math.floor(rand() * 4 * 24 * 60) * 60 * 1000),
  }));
}

const ORDERS = buildOrders();
const RIDERS = buildRiders();
const RIDER_APPLICATIONS = buildRiderApplications();
const INCOMPLETE_RIDERS = buildIncompleteRiders();
const BLOCKED_RIDERS = buildBlockedRiders();
const DELETE_REQUESTS = buildDeleteRequests();
const TRANSACTIONS = buildTransactions();
const COUPONS = buildCoupons();
const CUSTOMERS = buildCustomers();
const SUPPORT_TICKETS = buildSupportTickets();
const ADMIN_USERS = buildAdminUsers();

// Sidebar badge counts — plain numbers so the client-rendered nav tree
// doesn't need to call the async getters just to size a badge.
export const RIDER_REQUEST_COUNT = RIDER_APPLICATIONS.length;
export const INCOMPLETE_RIDER_COUNT = INCOMPLETE_RIDERS.length;
export const BLOCKED_RIDER_COUNT = BLOCKED_RIDERS.length;
export const DELETE_REQUEST_COUNT = DELETE_REQUESTS.length;
export const WITHDRAWAL_REQUEST_COUNT = TRANSACTIONS.filter((t) => t.type === "withdrawal" && t.status === "pending").length;
export const OPEN_SUPPORT_COUNT = SUPPORT_TICKETS.filter((t) => t.status === "open").length;
export const RIDER_COUNT = RIDERS.length;
export const CUSTOMER_COUNT = CUSTOMERS.length;

export async function getOrders(): Promise<Order[]> {
  return ORDERS;
}

export async function getRecentOrders(limit = 5): Promise<Order[]> {
  return [...ORDERS].sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime()).slice(0, limit);
}

export async function getRiders(): Promise<Rider[]> {
  return RIDERS;
}

export async function getRiderApplications(): Promise<RiderApplication[]> {
  return RIDER_APPLICATIONS;
}

export async function getIncompleteRiders(): Promise<IncompleteRider[]> {
  return INCOMPLETE_RIDERS;
}

export async function getBlockedRiders(): Promise<BlockedRider[]> {
  return BLOCKED_RIDERS;
}

export async function getRiderDeleteRequests(): Promise<RiderDeleteRequest[]> {
  return DELETE_REQUESTS;
}

export async function getTransactions(): Promise<Transaction[]> {
  return TRANSACTIONS;
}

export async function getCoupons(): Promise<Coupon[]> {
  return COUPONS;
}

export async function getCustomers(): Promise<Customer[]> {
  return CUSTOMERS;
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  return CUSTOMERS.find((c) => c.id === id);
}

export async function getAdminUserById(id: string): Promise<AdminUser | undefined> {
  return ADMIN_USERS.find((a) => a.id === id);
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  return SUPPORT_TICKETS;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return ADMIN_USERS;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  return {
    activeDeliveries: {
      value: ORDERS.filter((o) => o.status === "in_transit" || o.status === "pending").length,
      deltaPercent: 8.2,
      trend: [14, 16, 15, 18, 20, 19, 22],
    },
    ridersOnline: {
      value: RIDERS.filter((r) => r.status !== "offline").length,
      deltaPercent: -4.1,
      trend: [8, 9, 7, 8, 6, 7, RIDERS.filter((r) => r.status !== "offline").length],
    },
    revenueToday: {
      value: ORDERS.reduce((sum, o) => sum + (o.status !== "cancelled" ? o.total : 0), 0),
      deltaPercent: 12.6,
      trend: [40000, 52000, 48000, 61000, 58000, 70000, 76000],
    },
    completionRate: {
      value: Math.round(
        (ORDERS.filter((o) => o.status === "delivered").length /
          ORDERS.filter((o) => o.status !== "pending").length) *
          1000
      ) / 10,
    },
  };
}

export async function getDeliveryTrend(): Promise<DayPoint[]> {
  const base = [62, 70, 58, 74, 81, 76, 90, 85, 78, 92, 88, 95, 101, 97];
  return base.map((value, i) => ({
    date: formatShortDate(daysAgo(13 - i)),
    value,
  }));
}

export async function getRevenueTrend(): Promise<DayPoint[]> {
  const base = [
    182000, 205000, 176000, 221000, 248000, 231000, 268000, 252000, 239000, 275000, 261000, 288000, 302000, 296000,
  ];
  return base.map((value, i) => ({
    date: formatShortDate(daysAgo(13 - i)),
    value,
  }));
}

export async function getOrderStatusBreakdown(): Promise<StatusCount[]> {
  return ORDER_STATUSES.map((status) => ({
    status,
    count: ORDERS.filter((o) => o.status === status).length,
  }));
}

function daysAgo(n: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
