/**
 * Presence, not the rider lifecycle. `RiderStatus` in _lib/status now mirrors
 * the backend enum (pending_review / approved / rejected / suspended), which is
 * a different question from whether someone is out on a delivery right now.
 */
export type MockRiderPresence = "available" | "on_delivery" | "offline";

/**
 * Mock data for the modules the backend does not serve yet: Riders, Support,
 * the Transactions sub-pages (earnings/deposits/withdrawals), and the audience
 * directory that Communications reads.
 *
 * Orders, vendors, customers-as-a-module, coupons, admin users and the overview
 * are now backed by the real API — their getters have been removed rather than
 * left to rot. `Customer` and `getCustomers` survive only because the
 * Communications composer needs an audience list, which has no endpoint.
 */

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

export type Rider = {
  id: string;
  name: string;
  phone: string;
  status: MockRiderPresence;
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

export type CustomerStatus = "active" | "disabled" | "banned";
/** Retained only as the Communications audience directory. */
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

export type DayPoint = { date: string; value: number };

const NOW = new Date("2026-08-07T17:30:00");

const CUSTOMER_NAMES = [
  "Ada Obi", "Femi Alade", "Chinwe Nnamdi", "Tunde Bakare", "Ngozi Eze",
  "Kunle Afolabi", "Amaka Chukwu", "Segun Adewale", "Ifeoma Uche", "Bayo Ogundele",
  "Zainab Bello", "Emeka Umeh", "Yemi Adeyemi", "Chidera Okeke", "Musa Danjuma",
  "Halima Sani", "Tobi Ojo", "Grace Nwosu", "Aliyu Garba", "Blessing Etim",
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

const rand = mulberry32(42);

function buildRiders(): Rider[] {
  return RIDER_NAMES.map((name, i) => {
    const statusRoll = rand();
    const status: MockRiderPresence = statusRoll < 0.4 ? "available" : statusRoll < 0.8 ? "on_delivery" : "offline";
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
      status: (() => {
        const roll = rand();
        if (roll < 0.88) return "active";
        if (roll < 0.96) return "disabled";
        return "banned";
      })(),
    };
  });
}

const RIDERS = buildRiders();
const RIDER_APPLICATIONS = buildRiderApplications();
const INCOMPLETE_RIDERS = buildIncompleteRiders();
const BLOCKED_RIDERS = buildBlockedRiders();
const DELETE_REQUESTS = buildDeleteRequests();
const TRANSACTIONS = buildTransactions();
const CUSTOMERS = buildCustomers();

// Badge counts for the nav sections that have no API. The Orders and Vendors
// badges are real totals, fetched in the dashboard layout.
export const RIDER_REQUEST_COUNT = RIDER_APPLICATIONS.length;
export const INCOMPLETE_RIDER_COUNT = INCOMPLETE_RIDERS.length;
export const BLOCKED_RIDER_COUNT = BLOCKED_RIDERS.length;
export const DELETE_REQUEST_COUNT = DELETE_REQUESTS.length;
export const WITHDRAWAL_REQUEST_COUNT = TRANSACTIONS.filter((t) => t.type === "withdrawal" && t.status === "pending").length;
export const RIDER_COUNT = RIDERS.length;
export const CUSTOMER_COUNT = CUSTOMERS.length;

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

/**
 * Kept for the Communications audience picker, which needs a list of people to
 * address and has no backend endpoint. The Customers module itself now reads
 * `GET /admin/customers`.
 */
export async function getCustomers(): Promise<Customer[]> {
  return CUSTOMERS;
}
