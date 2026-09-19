import type { Metadata } from "next";

import { PageHeader } from "../_components/page-header";
import { Badge } from "../_components/status-badge";
import { userStatusMeta } from "../_lib/status";
import { ChangePasswordForm } from "./change-password-form";
import { getAdminProfile } from "@/lib/services/profile.service";

export const metadata: Metadata = {
  title: "Your account — BagyesRUSH",
};

/**
 * The signed-in admin's own account.
 *
 * This route used to render a "General / Notifications / Platform" form whose
 * save button resolved a timer and wrote nothing — platform name, support
 * email and a maintenance-mode switch that no endpoint existed for. Everything
 * it pretended to control either lives on the money settings screen or does not
 * exist, so it is gone rather than left looking functional.
 */
export default async function AccountSettingsPage() {
  const profile = await getAdminProfile();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader
        title="Your account"
        description="Your sign-in details and password."
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
        <h2 className="break-words text-sm font-semibold text-foreground">Signed in as</h2>
        <dl className="flex flex-col gap-2">
          <Row label="Email" value={profile.email} />
          {/* The number that receives the sign-in code, so it is worth showing
              here: an admin who changes SIM has to have it updated by a super
              administrator before they can get back in. */}
          <Row label="Phone" value={profile.phone} />
          <Row label="Role" value={profile.role_label ?? "—"} />
          <Row
            label="Status"
            value={<Badge meta={userStatusMeta[profile.status]} />}
          />
        </dl>
      </div>

      <ChangePasswordForm />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-subtle py-2 last:border-0">
      <dt className="break-words text-sm text-text-muted">{label}</dt>
      <dd className="break-words text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
