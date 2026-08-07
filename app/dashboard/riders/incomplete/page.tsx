import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { formatDateTime } from "../../_lib/format";
import { getIncompleteRiders } from "../../_services/mock-data";

export const metadata: Metadata = {
  title: "Incomplete Riders — Bagyes Rush Delivery",
};

export default async function IncompleteRidersPage() {
  const riders = await getIncompleteRiders();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Incomplete riders" description="Riders who started onboarding but haven't finished." />

      <TableShell>
        <thead>
          <tr>
            <TableHeadCell>Rider</TableHeadCell>
            <TableHeadCell>Phone</TableHeadCell>
            <TableHeadCell>Missing steps</TableHeadCell>
            <TableHeadCell>Started</TableHeadCell>
          </tr>
        </thead>
        <tbody>
          {riders.map((rider) => (
            <tr key={rider.id}>
              <TableCell className="font-medium">{rider.name}</TableCell>
              <TableCell className="text-text-secondary">{rider.phone}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {rider.missingSteps.map((step) => (
                    <span
                      key={step}
                      className="rounded-full bg-status-warning/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"
                    >
                      {step}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-text-secondary">{formatDateTime(rider.startedAt)}</TableCell>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}
