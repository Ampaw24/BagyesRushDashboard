import type { Metadata } from "next";

import { PageHeader } from "../_components/page-header";
import { StatTile } from "../_components/stat-tile";
import { NoPermissionState, NotDeployedState } from "../_components/empty-state";
import { ChatIcon, DangerIcon, SupportIcon, UsersIcon } from "../_lib/icons";
import { ConversationsTable } from "./conversations-table";
import { toConversationRow } from "@/lib/mappers/conversation.mapper";
import {
  getConversationStats,
  listConversations,
} from "@/lib/services/conversations.service";
import { isMissingEndpoint } from "@/lib/api/errors";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams, readBooleanParam, readEnumParam } from "@/lib/api/query";
import { CONVERSATION_STATUSES } from "@/lib/types/enums";
import type { ConversationStatsDto } from "@/lib/types/api";

export const metadata: Metadata = {
  title: "Conversations — BagyesRUSH",
};

/**
 * Every customer-and-rider chat on the platform.
 *
 * The chat shipped as a two-person feature authorised by membership alone,
 * which is right for the two of them and left staff unable to read the one
 * record a disputed delivery turns on — "the rider says he called, the customer
 * says nobody came" had an answer nobody could look at. This is that surface.
 */
export default async function ConversationsPage(props: PageProps<"/dashboard/conversations">) {
  const permissions = await getPermissions();

  if (!can(permissions, "chat.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Conversations" description="Customer and rider chat on every delivery." />
        <NoPermissionState what="delivery conversations" />
      </div>
    );
  }

  const params = await props.searchParams;
  const list = parseListParams(params);
  const status = readEnumParam(params, "status", CONVERSATION_STATUSES);
  const hasAdmin = readBooleanParam(params, "has_admin");

  let page;
  let stats: ConversationStatsDto | null = null;

  try {
    [page, stats] = await Promise.all([
      listConversations({
        page: list.page,
        per_page: list.per_page,
        search: list.search,
        status,
        has_admin: hasAdmin,
      }),
      getConversationStats(),
    ]);
  } catch (error) {
    // The dashboard and the API deploy separately, and this endpoint is new.
    // Saying so beats "Something went wrong", which sends somebody hunting a
    // bug that is really a pending deploy.
    if (isMissingEndpoint(error)) {
      return (
        <div className="flex flex-col gap-6">
          <PageHeader title="Conversations" description="Customer and rider chat on every delivery." />
          <NotDeployedState what="Delivery conversations" />
        </div>
      );
    }
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Conversations"
        description="Every customer and rider chat, including threads nobody on staff has joined."
      />

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Open" value={stats.open.toLocaleString()} icon={<ChatIcon />} />
          <StatTile
            label="Active today"
            value={stats.active_today.toLocaleString()}
            icon={<DangerIcon />}
          />
          {/* The handover question: which arguments has somebody already
              picked up, and which are still only between the two of them. */}
          <StatTile
            label="Staff have joined"
            value={stats.with_support.toLocaleString()}
            icon={<SupportIcon />}
          />
          <StatTile label="All threads" value={stats.total.toLocaleString()} icon={<UsersIcon />} />
        </div>
      )}

      <ConversationsTable
        conversations={page.items.map(toConversationRow)}
        pagination={page.pagination}
      />
    </div>
  );
}
