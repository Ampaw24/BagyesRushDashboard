"use client";

import { useState } from "react";
import { SearchIcon } from "../../_lib/icons";
import type { Customer } from "../../_services/mock-data";
import type { UseVendorComposer } from "../../_hooks/use-vendor-composer";

export function VendorOwnerStep({ composer, customers }: { composer: UseVendorComposer; customers: Customer[] }) {
  const { state, update } = composer;
  const [query, setQuery] = useState("");

  const filtered = customers.filter((c) => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return true;
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q) || c.id.toLowerCase().includes(q);
  });

  const selected = customers.find((c) => c.id === state.ownerUserId);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        Link this vendor to an existing customer account rather than creating a new user. If the owner doesn&apos;t have an account yet,
        they&apos;ll need to sign up first.
      </p>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, or phone"
          className="h-11 w-full rounded-lg border border-border-subtle bg-surface pl-9 pr-3.5 text-sm text-foreground outline-none transition duration-150 placeholder:text-text-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </div>

      <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-lg border border-border-subtle p-2">
        {filtered.length === 0 && <p className="px-2 py-4 text-center text-sm text-text-muted">No matches.</p>}
        {filtered.map((customer) => (
          <label
            key={customer.id}
            className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 hover:bg-surface-muted"
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="owner"
                checked={state.ownerUserId === customer.id}
                onChange={() => update("ownerUserId", customer.id)}
                className="h-4 w-4 accent-brand"
              />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{customer.name}</span>
                <span className="text-xs text-text-muted">
                  {customer.email} · {customer.phone}
                </span>
              </span>
            </span>
          </label>
        ))}
      </div>

      {selected && (
        <div className="rounded-lg bg-surface-muted px-4 py-3 text-sm text-foreground">
          Owner: <span className="font-semibold">{selected.name}</span> ({selected.id})
        </div>
      )}
    </div>
  );
}
