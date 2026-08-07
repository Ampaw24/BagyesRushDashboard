import type { Metadata } from "next";
import { PageHeader } from "../_components/page-header";
import { Badge } from "../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { ticketPriorityMeta, ticketStatusMeta } from "../_lib/status";
import { formatDateTime } from "../_lib/format";
import { getSupportTickets } from "../_services/mock-data";

export const metadata: Metadata = {
  title: "Support — Bagyes Rush Delivery",
};

export default async function SupportPage() {
  const tickets = await getSupportTickets();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Support" description="Customer and rider tickets that need a response." />

      <TableShell>
        <thead>
          <tr>
            <TableHeadCell>Ticket</TableHeadCell>
            <TableHeadCell>Customer</TableHeadCell>
            <TableHeadCell>Subject</TableHeadCell>
            <TableHeadCell>Priority</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Updated</TableHeadCell>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <TableCell className="font-medium">{ticket.id}</TableCell>
              <TableCell className="text-text-secondary">{ticket.customer}</TableCell>
              <TableCell className="text-text-secondary">{ticket.subject}</TableCell>
              <TableCell>
                <Badge meta={ticketPriorityMeta[ticket.priority]} />
              </TableCell>
              <TableCell>
                <Badge meta={ticketStatusMeta[ticket.status]} />
              </TableCell>
              <TableCell className="text-text-secondary">{formatDateTime(ticket.updatedAt)}</TableCell>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}
