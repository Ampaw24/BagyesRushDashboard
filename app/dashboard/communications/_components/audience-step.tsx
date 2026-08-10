"use client";

import { useState } from "react";
import { communicationTypeMeta } from "../../_lib/communications";
import { SearchIcon } from "../../_lib/icons";
import type { AudienceDirectoryEntry, AudienceSegment, AudienceRole, AudienceType, CommunicationType } from "../../_services/communications-mock-data";
import type { UseCommunicationComposer } from "../../_hooks/use-communication-composer";

const AUDIENCE_OPTIONS: { value: AudienceType; label: string; description: string }[] = [
  { value: "all", label: "All users", description: "Every active rider and customer." },
  { value: "role", label: "By role", description: "Target riders, customers, or both." },
  { value: "segment", label: "Custom audience", description: "Target by an existing account attribute." },
  { value: "users", label: "Specific users", description: "Search and select individual recipients." },
];

const TYPE_OPTIONS = Object.entries(communicationTypeMeta) as [CommunicationType, { label: string }][];
const ROLE_OPTIONS: AudienceRole[] = ["rider", "customer"];

export function AudienceStep({
  composer,
  directory,
  segments,
}: {
  composer: UseCommunicationComposer;
  directory: AudienceDirectoryEntry[];
  segments: AudienceSegment[];
}) {
  const { state, update, updateAudience, resolvedCount } = composer;
  const [userQuery, setUserQuery] = useState("");

  const filteredDirectory = directory.filter((entry) => {
    const q = userQuery.trim().toLowerCase();
    if (q.length === 0) return true;
    return entry.name.toLowerCase().includes(q) || entry.phone.includes(q) || entry.id.toLowerCase().includes(q);
  });

  function toggleRole(role: AudienceRole) {
    const roles = state.audience.roles.includes(role) ? state.audience.roles.filter((r) => r !== role) : [...state.audience.roles, role];
    updateAudience({ roles });
  }

  function toggleUser(id: string) {
    const userIds = state.audience.userIds.includes(id) ? state.audience.userIds.filter((u) => u !== id) : [...state.audience.userIds, id];
    updateAudience({ userIds });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="communication-type" className="text-sm font-medium text-text-secondary">
          Communication type
        </label>
        <select
          id="communication-type"
          value={state.type}
          onChange={(e) => update("type", e.target.value as CommunicationType)}
          className="h-11 w-full max-w-sm rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
        >
          {TYPE_OPTIONS.map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text-secondary">Audience</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AUDIENCE_OPTIONS.map((option) => {
            const isActive = state.audience.type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateAudience({ type: option.value })}
                aria-pressed={isActive}
                className={`flex min-h-11 flex-col gap-1 rounded-xl border p-4 text-left transition duration-150 ${
                  isActive ? "border-brand bg-brand/5" : "border-border-subtle bg-surface hover:bg-surface-muted"
                }`}
              >
                <span className={`text-sm font-semibold ${isActive ? "text-brand" : "text-foreground"}`}>{option.label}</span>
                <span className="break-words text-xs text-text-muted">{option.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {state.audience.type === "role" && (
        <div className="flex flex-col gap-2">
          {ROLE_OPTIONS.map((role) => {
            const count = directory.filter((d) => d.role === role).length;
            const checked = state.audience.roles.includes(role);
            return (
              <label
                key={role}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-2.5"
              >
                <span className="flex items-center gap-3">
                  <input type="checkbox" checked={checked} onChange={() => toggleRole(role)} className="h-4 w-4 accent-brand" />
                  <span className="text-sm font-medium capitalize text-foreground">{role}s</span>
                </span>
                <span className="text-xs text-text-muted">{count.toLocaleString()} people</span>
              </label>
            );
          })}
        </div>
      )}

      {state.audience.type === "segment" && (
        <div className="flex flex-col gap-2">
          {segments.map((segment) => (
            <label
              key={segment.id}
              className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-2.5"
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="segment"
                  checked={state.audience.segmentId === segment.id}
                  onChange={() => updateAudience({ segmentId: segment.id })}
                  className="h-4 w-4 accent-brand"
                />
                <span className="text-sm font-medium text-foreground">{segment.label}</span>
              </span>
              <span className="text-xs text-text-muted">{segment.count.toLocaleString()} people</span>
            </label>
          ))}
        </div>
      )}

      {state.audience.type === "users" && (
        <div className="flex flex-col gap-3">
          <div className="relative max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search name, phone, or ID"
              className="h-11 w-full rounded-lg border border-border-subtle bg-surface pl-9 pr-3.5 text-sm text-foreground outline-none transition duration-150 placeholder:text-text-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-lg border border-border-subtle p-2">
            {filteredDirectory.length === 0 && <p className="px-2 py-4 text-center text-sm text-text-muted">No matches.</p>}
            {filteredDirectory.map((entry) => {
              const checked = state.audience.userIds.includes(entry.id);
              return (
                <label
                  key={entry.id}
                  className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 hover:bg-surface-muted"
                >
                  <span className="flex items-center gap-3">
                    <input type="checkbox" checked={checked} onChange={() => toggleUser(entry.id)} className="h-4 w-4 accent-brand" />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{entry.name}</span>
                      <span className="text-xs text-text-muted">
                        {entry.id} · {entry.phone}
                      </span>
                    </span>
                  </span>
                  <span className="text-xs capitalize text-text-muted">{entry.role}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-4 py-3">
        <span className="text-sm text-text-secondary">Estimated recipients:</span>
        <span className="text-sm font-semibold text-foreground">{resolvedCount.toLocaleString()}</span>
      </div>
    </div>
  );
}
