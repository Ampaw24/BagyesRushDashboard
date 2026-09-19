/**
 * Where a ledger or payout row's owner lives on the dashboard.
 *
 * Riders and vendors have their own detail pages. Customers do not — they are
 * a dialog on the customers list — so a customer row deep-links to that list
 * filtered to them rather than to a route that does not exist.
 */
export function ownerHref(
  ownerType: "rider" | "vendor" | "customer" | null,
  ownerId: number | null,
): string {
  if (ownerType === "vendor") return `/dashboard/vendors/${ownerId}`;
  if (ownerType === "customer") return `/dashboard/users?customer=${ownerId}`;

  return `/dashboard/riders/${ownerId}`;
}
