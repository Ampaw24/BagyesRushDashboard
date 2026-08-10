import type { Metadata } from "next";
import { PageHeader } from "../../_components/page-header";
import { getPermissions } from "../../_services/administration-mock-data";

export const metadata: Metadata = {
  title: "Permissions — Bagyes Rush Delivery",
};

export default async function PermissionsPage() {
  const permissions = await getPermissions();
  const resources = Array.from(new Set(permissions.map((p) => p.resource)));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Permissions" description="The full permission catalog available to assign to roles." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {resources.map((resource) => (
          <div key={resource} className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
            <h3 className="text-sm font-semibold capitalize text-foreground">{resource}</h3>
            <ul className="flex flex-col gap-2">
              {permissions
                .filter((p) => p.resource === resource)
                .map((p) => (
                  <li key={p.key} className="flex flex-col gap-0.5 border-b border-border-subtle pb-2 last:border-0 last:pb-0">
                    <span className="flex items-center gap-2">
                      <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-text-secondary">{p.key}</code>
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                    </span>
                    <span className="text-xs text-text-muted">{p.description}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
