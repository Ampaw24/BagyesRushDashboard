export function VendorOrdersTab() {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
      <p className="text-sm font-medium text-foreground">No order history linked yet</p>
      <p className="max-w-sm text-sm text-text-muted">
        Orders aren&apos;t associated with a vendor in this dataset yet — once vendor-scoped ordering exists, it will surface here.
      </p>
    </div>
  );
}
