import type { OrderStatus, RiderStatus } from "../_lib/status";

// Deterministic PRNG (mulberry32) so mock numbers are stable across server
// render and client hydration — no Math.random() drift.
function mulberry32(seed: number) {
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

const ORDERS = buildOrders();
const RIDERS = buildRiders();

export async function getOrders(): Promise<Order[]> {
  return ORDERS;
}

export async function getRecentOrders(limit = 5): Promise<Order[]> {
  return [...ORDERS].sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime()).slice(0, limit);
}

export async function getRiders(): Promise<Rider[]> {
  return RIDERS;
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
