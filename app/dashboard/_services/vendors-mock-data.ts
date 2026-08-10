import { mulberry32 } from "./mock-data";
import type { DayPoint } from "./mock-data";

export type VendorStatus = "active" | "pending" | "suspended" | "inactive" | "archived";
export type VerificationStatus = "pending" | "verified" | "rejected" | "requires_review";
export type VendorCategory = "Restaurant" | "Fast Food" | "Bakery" | "Groceries" | "Pharmacy" | "Drinks & Beverages";

export type VendorSuspension = { reason: string; note?: string; effectiveAt: Date; endAt: Date | null };

export type Vendor = {
  id: string;
  businessName: string;
  registrationName: string;
  description: string;
  category: VendorCategory;
  logoUrl?: string;
  coverImageUrl?: string;
  phone: string;
  email: string;
  website?: string;
  ownerUserId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  deliveryAreaKm: number;
  openingTime: string;
  closingTime: string;
  operatingDays: string[];
  minimumOrderAmount: number;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  estimatedPrepMinutes: number;
  status: VendorStatus;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  suspension?: VendorSuspension;
  joinedAt: Date;
  lastActiveAt: Date;
  createdBy: string;
  updatedBy: string;
  updatedAt: Date;
};

export type VendorStatusEvent = {
  id: string;
  vendorId: string;
  previousStatus: VendorStatus | null;
  newStatus: VendorStatus;
  reason?: string;
  changedBy: string;
  createdAt: Date;
};

export type VendorMenuItem = { id: string; vendorId: string; name: string; price: number; category: string; available: boolean };

const NOW = new Date("2026-08-07T17:30:00");
const ADMIN_NAMES = ["Chioma Nwadike", "Bashir Umar", "Funmilayo Ade", "Tochukwu Igwe", "Patience Okoli"];
const CUSTOMER_NAMES = [
  "Ada Obi", "Femi Alade", "Chinwe Nnamdi", "Tunde Bakare", "Ngozi Eze",
  "Kunle Afolabi", "Amaka Chukwu", "Segun Adewale", "Ifeoma Uche", "Bayo Ogundele",
  "Zainab Bello", "Emeka Umeh", "Yemi Adeyemi", "Chidera Okeke", "Musa Danjuma",
  "Halima Sani", "Tobi Ojo", "Grace Nwosu",
];
const OPERATING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const rand = mulberry32(19);

function daysAgo(n: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

type SeedInput = {
  businessName: string;
  category: VendorCategory;
  city: string;
  region: string;
  status: VendorStatus;
  verificationStatus: VerificationStatus;
  joinedDaysAgo: number;
  rejectionReason?: string;
  suspensionReason?: string;
};

const SEEDS: SeedInput[] = [
  { businessName: "Mama Put Kitchen", category: "Restaurant", city: "Lagos", region: "Ikeja", status: "active", verificationStatus: "verified", joinedDaysAgo: 210 },
  { businessName: "Jollof Junction", category: "Fast Food", city: "Lagos", region: "Surulere", status: "active", verificationStatus: "verified", joinedDaysAgo: 180 },
  { businessName: "Naija Bites", category: "Fast Food", city: "Abuja", region: "Wuse", status: "active", verificationStatus: "verified", joinedDaysAgo: 160 },
  { businessName: "The Bread Basket", category: "Bakery", city: "Lagos", region: "Lekki", status: "active", verificationStatus: "verified", joinedDaysAgo: 140 },
  { businessName: "FreshMart Groceries", category: "Groceries", city: "Ibadan", region: "Bodija", status: "active", verificationStatus: "verified", joinedDaysAgo: 300 },
  { businessName: "Suya Spot", category: "Restaurant", city: "Abuja", region: "Garki", status: "active", verificationStatus: "verified", joinedDaysAgo: 95 },
  { businessName: "Ocean Basket Grill", category: "Restaurant", city: "Port Harcourt", region: "GRA", status: "active", verificationStatus: "verified", joinedDaysAgo: 75 },
  { businessName: "Chow Express", category: "Fast Food", city: "Lagos", region: "Yaba", status: "active", verificationStatus: "requires_review", joinedDaysAgo: 40 },
  { businessName: "Amala Sky", category: "Restaurant", city: "Lagos", region: "Ikeja", status: "pending", verificationStatus: "pending", joinedDaysAgo: 4 },
  { businessName: "Refresh Drinks Co", category: "Drinks & Beverages", city: "Lagos", region: "VI", status: "pending", verificationStatus: "pending", joinedDaysAgo: 2 },
  { businessName: "Pepper Soup Palace", category: "Restaurant", city: "Port Harcourt", region: "Trans Amadi", status: "pending", verificationStatus: "pending", joinedDaysAgo: 1 },
  { businessName: "Ikeja Pharmacy Plus", category: "Pharmacy", city: "Lagos", region: "Ikeja", status: "suspended", verificationStatus: "verified", joinedDaysAgo: 260, suspensionReason: "Policy violation" },
  { businessName: "QuickBite Diner", category: "Fast Food", city: "Abuja", region: "Maitama", status: "suspended", verificationStatus: "verified", joinedDaysAgo: 190, suspensionReason: "Payment issue" },
  { businessName: "VI Wellness Pharmacy", category: "Pharmacy", city: "Lagos", region: "VI", status: "inactive", verificationStatus: "verified", joinedDaysAgo: 320 },
  { businessName: "Sunrise Bakery", category: "Bakery", city: "Ibadan", region: "Ring Road", status: "inactive", verificationStatus: "verified", joinedDaysAgo: 400 },
  { businessName: "Lekki Bakehouse", category: "Bakery", city: "Lagos", region: "Lekki", status: "archived", verificationStatus: "verified", joinedDaysAgo: 500 },
  { businessName: "Green Grocer", category: "Groceries", city: "Abuja", region: "Garki", status: "archived", verificationStatus: "rejected", joinedDaysAgo: 60, rejectionReason: "Incomplete business documentation" },
  { businessName: "Chapman & Co Beverages", category: "Drinks & Beverages", city: "Port Harcourt", region: "GRA", status: "archived", verificationStatus: "rejected", joinedDaysAgo: 30, rejectionReason: "Duplicate registration" },
];

const MENU_ITEMS_BY_CATEGORY: Record<VendorCategory, string[]> = {
  Restaurant: ["Jollof Rice & Chicken", "Fried Rice Combo", "Egusi Soup & Pounded Yam", "Grilled Fish Platter", "Pepper Soup"],
  "Fast Food": ["Chicken Burger", "Beef Shawarma", "Loaded Fries", "Meat Pie", "Spring Rolls"],
  Bakery: ["Sliced Bread Loaf", "Chocolate Cake Slice", "Meat Pie Pack", "Doughnuts (6pc)", "Banana Bread"],
  Groceries: ["Rice (5kg Bag)", "Cooking Oil (2L)", "Tomato Basket", "Assorted Spices Pack", "Fresh Vegetables Bundle"],
  Pharmacy: ["Paracetamol Pack", "Vitamin C Tablets", "First Aid Kit", "Hand Sanitizer", "Blood Pressure Monitor"],
  "Drinks & Beverages": ["Chapman (1L)", "Zobo Drink", "Assorted Soft Drinks Pack", "Fresh Juice Bundle", "Bottled Water Crate"],
};

function buildVendors(): Vendor[] {
  return SEEDS.map((seed, i) => {
    const id = `VD-${(500 + i).toString()}`;
    const ownerName = CUSTOMER_NAMES[i % CUSTOMER_NAMES.length];
    const status = seed.status;
    const suspension: VendorSuspension | undefined =
      status === "suspended"
        ? { reason: seed.suspensionReason ?? "Administrative action", effectiveAt: daysAgo(Math.min(seed.joinedDaysAgo, 14)), endAt: null }
        : undefined;

    return {
      id,
      businessName: seed.businessName,
      registrationName: `${seed.businessName} Nigeria Ltd`,
      description: `${seed.businessName} serves ${seed.category.toLowerCase()} to customers in ${seed.city}.`,
      category: seed.category,
      logoUrl: undefined,
      coverImageUrl: undefined,
      phone: `+234 80${Math.floor(10000000 + rand() * 89999999)}`,
      email: `${seed.businessName.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@vendor.com`,
      website: undefined,
      ownerUserId: `CU-${800 + (i % 20)}`,
      ownerName,
      ownerEmail: `${ownerName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      ownerPhone: `+234 80${Math.floor(10000000 + rand() * 89999999)}`,
      address: `${5 + Math.floor(rand() * 90)} ${seed.region} Road`,
      city: seed.city,
      region: seed.region,
      latitude: 6.4 + rand() * 3,
      longitude: 3.1 + rand() * 5,
      deliveryAreaKm: 3 + Math.floor(rand() * 12),
      openingTime: "09:00",
      closingTime: "22:00",
      operatingDays: OPERATING_DAYS.filter(() => rand() < 0.9),
      minimumOrderAmount: 1000 + Math.floor(rand() * 4000),
      deliveryAvailable: rand() < 0.85,
      pickupAvailable: rand() < 0.6,
      estimatedPrepMinutes: 15 + Math.floor(rand() * 30),
      status,
      verificationStatus: seed.verificationStatus,
      rejectionReason: seed.rejectionReason,
      suspension,
      joinedAt: daysAgo(seed.joinedDaysAgo),
      lastActiveAt: daysAgo(Math.floor(rand() * Math.min(seed.joinedDaysAgo, 10))),
      createdBy: pick(ADMIN_NAMES),
      updatedBy: pick(ADMIN_NAMES),
      updatedAt: daysAgo(Math.floor(rand() * Math.min(seed.joinedDaysAgo, 20))),
    };
  });
}

function buildStatusHistory(vendors: Vendor[]): VendorStatusEvent[] {
  const events: VendorStatusEvent[] = [];
  let counter = 0;

  for (const vendor of vendors) {
    counter += 1;
    events.push({
      id: `VSE-${(1000 + counter).toString()}`,
      vendorId: vendor.id,
      previousStatus: null,
      newStatus: "pending",
      changedBy: vendor.createdBy,
      createdAt: vendor.joinedAt,
    });

    if (vendor.status !== "pending") {
      counter += 1;
      events.push({
        id: `VSE-${(1000 + counter).toString()}`,
        vendorId: vendor.id,
        previousStatus: "pending",
        newStatus: vendor.status === "archived" || vendor.status === "suspended" || vendor.status === "inactive" ? "active" : vendor.status,
        reason: "Approved after document review.",
        changedBy: vendor.createdBy,
        createdAt: new Date(vendor.joinedAt.getTime() + 2 * 24 * 60 * 60 * 1000),
      });
    }

    if (vendor.status === "suspended" || vendor.status === "inactive" || vendor.status === "archived") {
      counter += 1;
      events.push({
        id: `VSE-${(1000 + counter).toString()}`,
        vendorId: vendor.id,
        previousStatus: "active",
        newStatus: vendor.status,
        reason: vendor.suspension?.reason ?? vendor.rejectionReason ?? "Administrative action",
        changedBy: vendor.updatedBy,
        createdAt: vendor.updatedAt,
      });
    }
  }

  return events;
}

function buildMenuItems(vendors: Vendor[]): VendorMenuItem[] {
  const items: VendorMenuItem[] = [];
  let counter = 0;

  for (const vendor of vendors) {
    const names = MENU_ITEMS_BY_CATEGORY[vendor.category];
    for (const name of names) {
      counter += 1;
      items.push({
        id: `MI-${(2000 + counter).toString()}`,
        vendorId: vendor.id,
        name,
        price: 800 + Math.floor(rand() * 6000),
        category: vendor.category,
        available: vendor.status === "active" ? rand() < 0.9 : false,
      });
    }
  }

  return items;
}

const VENDORS = buildVendors();
const STATUS_HISTORY = buildStatusHistory(VENDORS);
const MENU_ITEMS = buildMenuItems(VENDORS);

export const PENDING_VENDOR_APPLICATIONS_COUNT = VENDORS.filter(
  (v) => v.verificationStatus === "pending" || v.verificationStatus === "requires_review"
).length;

export async function getVendors(): Promise<Vendor[]> {
  return [...VENDORS].sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());
}

export async function getVendorById(id: string): Promise<Vendor | undefined> {
  return VENDORS.find((v) => v.id === id);
}

export async function getVendorStatusHistory(vendorId: string): Promise<VendorStatusEvent[]> {
  return STATUS_HISTORY.filter((e) => e.vendorId === vendorId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getAllVendorStatusEvents(): Promise<VendorStatusEvent[]> {
  return STATUS_HISTORY;
}

export async function getVendorMenuItems(vendorId: string): Promise<VendorMenuItem[]> {
  return MENU_ITEMS.filter((m) => m.vendorId === vendorId);
}

export type VendorsOverviewStats = {
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  suspendedVendors: number;
  newVendorsThisMonth: number;
  verifiedVendors: number;
};

export async function getVendorsOverviewStats(): Promise<VendorsOverviewStats> {
  return {
    totalVendors: VENDORS.length,
    activeVendors: VENDORS.filter((v) => v.status === "active").length,
    pendingVendors: VENDORS.filter((v) => v.status === "pending").length,
    suspendedVendors: VENDORS.filter((v) => v.status === "suspended").length,
    newVendorsThisMonth: VENDORS.filter((v) => v.joinedAt.getTime() >= NOW.getTime() - 30 * 24 * 60 * 60 * 1000).length,
    verifiedVendors: VENDORS.filter((v) => v.verificationStatus === "verified").length,
  };
}

export async function getVendorRegistrationsOverTime(): Promise<DayPoint[]> {
  const weeks = 14;
  const counts = new Array(weeks).fill(0);
  for (const v of VENDORS) {
    const diffDays = Math.floor((NOW.getTime() - v.joinedAt.getTime()) / (24 * 60 * 60 * 1000));
    const weekIndex = weeks - 1 - Math.floor(diffDays / 30);
    if (weekIndex >= 0 && weekIndex < weeks) counts[weekIndex] += 1;
  }
  return counts.map((value, i) => ({
    date: new Date(NOW.getTime() - (weeks - 1 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value,
  }));
}

export type CategoryCount = { category: VendorCategory; count: number };

export async function getVendorCategoryBreakdown(): Promise<CategoryCount[]> {
  const counts = new Map<VendorCategory, number>();
  for (const v of VENDORS) counts.set(v.category, (counts.get(v.category) ?? 0) + 1);
  return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
}

export type VendorStatusCount = { status: VendorStatus; count: number };

export async function getVendorStatusBreakdown(): Promise<VendorStatusCount[]> {
  const statuses: VendorStatus[] = ["active", "pending", "suspended", "inactive", "archived"];
  return statuses.map((status) => ({ status, count: VENDORS.filter((v) => v.status === status).length }));
}
