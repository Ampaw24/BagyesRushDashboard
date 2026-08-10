import { TableCell, TableHeadCell, TableShell } from "../../../_components/table-shell";
import { formatCurrency } from "../../../_lib/format";
import type { VendorMenuItem } from "../../../_services/vendors-mock-data";

export function VendorMenuTab({ items }: { items: VendorMenuItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-foreground">No menu items yet</p>
        <p className="text-sm text-text-muted">This vendor hasn&apos;t added any products.</p>
      </div>
    );
  }

  return (
    <TableShell>
      <thead>
        <tr>
          <TableHeadCell>Item</TableHeadCell>
          <TableHeadCell>Category</TableHeadCell>
          <TableHeadCell>Price</TableHeadCell>
          <TableHeadCell>Availability</TableHeadCell>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="text-text-secondary">{item.category}</TableCell>
            <TableCell className="text-text-secondary">{formatCurrency(item.price)}</TableCell>
            <TableCell className={item.available ? "text-status-good" : "text-text-muted"}>{item.available ? "Available" : "Unavailable"}</TableCell>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
