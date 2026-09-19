import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { ReferralsManager } from "./referrals-manager";
import {
  getReferralSummary,
  listReferralMilestones,
  listReferrals,
} from "@/lib/services/referrals.service";
import { getPlatformSettings } from "@/lib/services/platform-settings.service";
import { toReferralMilestoneRow, toReferralRow } from "@/lib/mappers/referral.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readEnumParam } from "@/lib/api/query";

export const metadata: Metadata = { title: "Refer & Earn — BagyesRUSH" };

const DESCRIPTION =
  "What a referral is worth, who has earned one, and what the programme has cost.";

const STATUSES = ["pending", "qualified", "cancelled"] as const;

/**
 * Refer and earn.
 *
 * The rates live on the platform settings screen, published and versioned with
 * commission — this page manages the milestone bonuses and reports on what the
 * programme has produced.
 */
export default async function ReferralsPage(props: PageProps<"/dashboard/settings/referrals">) {
  const permissions = await getPermissions();

  if (!can(permissions, "settings.manage")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Refer & earn" description={DESCRIPTION} />
        <NoPermissionState what="platform settings" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);

  const [summary, milestones, page, settings] = await Promise.all([
    getReferralSummary(),
    listReferralMilestones(),
    listReferrals({
      page: list.page,
      per_page: list.per_page,
      search: list.search,
      status: readEnumParam(params, "status", STATUSES),
    }),
    getPlatformSettings(),
  ]);

  const current = settings?.current ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Refer & earn" description={DESCRIPTION} />
      <ReferralsManager
        summary={summary}
        milestones={milestones.map(toReferralMilestoneRow)}
        referrals={page.items.map(toReferralRow)}
        pagination={page.pagination}
        rules={{
          enabled: current?.referral_enabled ?? false,
          reward: current?.referral_reward ?? 0,
          refereeBonus: current?.referral_referee_bonus ?? 0,
          minimumOrder: current?.referral_minimum_order ?? 0,
        }}
      />
    </div>
  );
}
