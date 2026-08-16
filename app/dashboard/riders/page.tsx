import type { Metadata } from "next";
import { PageHeader } from "../_components/page-header";
import { RiderStatusBadge } from "../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { PhoneIcon, StarIcon } from "../_lib/icons";
import { getRiders } from "../_services/mock-data";

export const metadata: Metadata = {
  title: "Riders — Bagyes Rush Delivery",
};

export default async function RidersPage() {
  const riders = await getRiders();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Riders" description="See who's online, on delivery, or offline right now." />

      <TableShell>
        <thead>
          <tr>
            <TableHeadCell>Rider</TableHeadCell>
            <TableHeadCell>Phone</TableHeadCell>
            <TableHeadCell>Rating</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Active orders</TableHeadCell>
            <TableHeadCell>Completed today</TableHeadCell>
          </tr>
        </thead>
        <tbody>
          {riders.map((rider) => (
            <tr key={rider.id}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                    {rider.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <span className="break-words">{rider.name}</span>
                </span>
              </TableCell>
              <TableCell className="text-text-secondary">
                <span className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 shrink-0 text-text-muted" />
                  {rider.phone}
                </span>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1">
                  <StarIcon className="text-status-warning" />
                  {rider.rating.toFixed(1)}
                </span>
              </TableCell>
              <TableCell>
                <RiderStatusBadge status={rider.status} />
              </TableCell>
              <TableCell>{rider.activeOrders}</TableCell>
              <TableCell>{rider.completedToday}</TableCell>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}
