"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVendorsFilter, type VendorStatusFilter, type VendorVerificationFilter } from "../../_hooks/use-vendors-filter";
import { useVendorStatusActions } from "../../_hooks/use-vendor-status-actions";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { Badge } from "../../_components/status-badge";
import { ActionMenu } from "../../_components/action-menu";
import { EditIcon, SearchIcon } from "../../_lib/icons";
import { vendorStatusMeta, verificationStatusMeta, VENDOR_CATEGORIES } from "../../_lib/vendors";
import { formatDate } from "../../_lib/format";
import type { Vendor } from "../../_services/vendors-mock-data";

const STATUS_OPTIONS: VendorStatusFilter[] = ["all", "active", "pending", "suspended", "inactive", "archived"];
const VERIFICATION_OPTIONS: VendorVerificationFilter[] = ["all", "verified", "pending", "requires_review", "rejected"];

function selectClass() {
  return "h-11 rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";
}

function VendorRow({ vendor, onUpdate }: { vendor: Vendor; onUpdate: (updates: Partial<Vendor>) => void }) {
  const router = useRouter();
  const { actions, dialog } = useVendorStatusActions(vendor, onUpdate);

  return (
    <tr>
      <TableCell className="font-medium">
        <Link href={`/dashboard/vendors/${vendor.id}`} className="hover:text-brand">
          {vendor.businessName}
        </Link>
      </TableCell>
      <TableCell className="text-text-secondary">{vendor.ownerName}</TableCell>
      <TableCell className="text-text-secondary">{vendor.category}</TableCell>
      <TableCell className="text-text-secondary">{vendor.city}</TableCell>
      <TableCell>
        <Badge meta={vendorStatusMeta[vendor.status]} />
      </TableCell>
      <TableCell>
        <Badge meta={verificationStatusMeta[vendor.verificationStatus]} />
      </TableCell>
      <TableCell className="text-text-secondary">{formatDate(vendor.joinedAt)}</TableCell>
      <TableCell>
        <ActionMenu items={[{ label: "View / edit", icon: EditIcon, onClick: () => router.push(`/dashboard/vendors/${vendor.id}`) }, ...actions]} />
        {dialog}
      </TableCell>
    </tr>
  );
}

export function VendorsTable({
  vendors,
  initialStatus = "all",
  initialVerification = "all",
}: {
  vendors: Vendor[];
  initialStatus?: VendorStatusFilter;
  initialVerification?: VendorVerificationFilter;
}) {
  const [items, setItems] = useState(vendors);
  const { query, setQuery, status, setStatus, verification, setVerification, category, setCategory, filtered } = useVendorsFilter(
    items,
    initialStatus,
    initialVerification
  );

  function handleUpdate(id: string, updates: Partial<Vendor>) {
    setItems((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ID, owner, email, phone"
            className="h-11 w-full rounded-lg border border-border-subtle bg-surface pl-9 pr-3.5 text-sm text-foreground outline-none transition duration-150 placeholder:text-text-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value as VendorStatusFilter)} className={selectClass()}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : vendorStatusMeta[s].label}
            </option>
          ))}
        </select>

        <select value={verification} onChange={(e) => setVerification(e.target.value as VendorVerificationFilter)} className={selectClass()}>
          {VERIFICATION_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v === "all" ? "All verification" : verificationStatusMeta[v].label}
            </option>
          ))}
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className={selectClass()}>
          <option value="all">All categories</option>
          {VENDOR_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">No vendors match your filters</p>
          <p className="text-sm text-text-muted">Try a different search term or filter.</p>
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Vendor</TableHeadCell>
              <TableHeadCell>Owner</TableHeadCell>
              <TableHeadCell>Category</TableHeadCell>
              <TableHeadCell>Location</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Verification</TableHeadCell>
              <TableHeadCell>Joined</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {filtered.map((vendor) => (
              <VendorRow key={vendor.id} vendor={vendor} onUpdate={(updates) => handleUpdate(vendor.id, updates)} />
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
