import { apiFetch } from "./client";
import type { Page, RetentionInfo, TeamMember } from "./types";

interface BackendTeamMember {
  userId: string;
  name: string;
  teamId?: string | null;
  teamName?: string | null;
  accountStatus: string;
  deactivatedAt?: string | null;
}

export function listTeamMembers(params?: { cursor?: string }) {
  return (async () => {
    const items: TeamMember[] = [];
    let cursor = params?.cursor;
    let page: Page<BackendTeamMember>["page"] = { nextCursor: null };
    do {
      const result = await apiFetch<Page<BackendTeamMember>>("/api/v1/site/team-members", {
        params: { cursor },
      });
      items.push(
        ...result.items.map((member): TeamMember => ({
          id: member.userId,
          name: member.name,
          teamId: member.teamId,
          teamName: member.teamName,
          active: member.accountStatus === "ACTIVE",
          withdrawnAt: member.deactivatedAt ?? undefined,
        })),
      );
      page = result.page;
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    return { items, page };
  })();
}

export function withdrawTeamMember(userId: string) {
  return apiFetch<void>(`/api/v1/site/team-members/${encodeURIComponent(userId)}`, { method: "DELETE" });
}

export function getRetention(userId: string) {
  return apiFetch<{
    retentionDays: number;
    deactivatedAt: string | null;
    purgeEligibleAt: string | null;
    status: "ACTIVE" | "RETAINED" | "ELIGIBLE_FOR_PURGE";
  }>(`/api/v1/site/team-members/${encodeURIComponent(userId)}/retention`).then((res): RetentionInfo => ({
    retentionUntil: res.purgeEligibleAt ?? "-",
    retentionDays: res.retentionDays,
    canPurge: res.status === "ELIGIBLE_FOR_PURGE",
  }));
}

export function purgePersonalData(userId: string) {
  return apiFetch<void>(`/api/v1/site/team-members/${encodeURIComponent(userId)}/personal-data`, { method: "DELETE" });
}
