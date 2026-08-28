import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState, NotDeployedState } from "../../_components/empty-state";
import { MoneySettingsEditor } from "./_components/money-settings-editor";
import { getPlatformSettings } from "@/lib/services/platform-settings.service";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Money Settings — BagyesRUSH",
};

const DESCRIPTION = "What the platform charges customers, and what it pays vendors and riders.";

/**
 * Every money rule on the platform.
 *
 * Versioned rather than edited: a vendor paid GHS 90 last Tuesday has to still
 * see GHS 90 next month, so publishing retires the old version instead of
 * rewriting it. That is why the history below is worth keeping.
 */
export default async function MoneySettingsPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "settings.manage")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Money settings" description={DESCRIPTION} />
        <NoPermissionState what="platform settings" />
      </div>
    );
  }

  const settings = await getPlatformSettings();

  if (!settings) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Money settings" description={DESCRIPTION} />
        <NotDeployedState what="Platform settings" />
      </div>
    );
  }

  const { current, history } = settings;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Money settings"
        description={DESCRIPTION}
        action={
          current.is_published ? (
            <span className="text-sm text-text-muted">Live: {current.name}</span>
          ) : (
            <span className="text-sm text-status-warning">Using defaults</span>
          )
        }
      />

      {!current.is_published && (
        <p className="rounded-xl border border-status-warning/30 bg-status-warning/10 p-4 text-sm text-foreground">
          Nothing has been published yet, so the platform is running on the values in its
          configuration. They are filled in below — publish them to take control, or change them
          first.
        </p>
      )}

      <MoneySettingsEditor current={current} history={history} />
    </div>
  );
}
