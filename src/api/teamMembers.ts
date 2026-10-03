import { apiFetch } from "./client";
import type { Page, RetentionInfo, TeamMember, TeamSummary } from "./types";

export function listTeamMembers(params?: { cursor?: string }) {
  return apiFetch<Page<TeamSummary>>("/api/v1/site/teams", { params }).then((res) => ({
    items: res.items.map(
      (t): TeamMember => ({
        id: t.id,
        name: t.leaderName,
        teamId: t.id,
        teamName: t.leaderName ? `${t.leaderName} 팀` : t.id,
        active: t.active,
      }),
    ),
    page: res.page,
  })) as Promise<Page<TeamMember>>;
}

export function withdrawTeamMember(userId: string) {
  return apiFetch<void>(`/api/v1/site/team-members/${userId}`, { method: "DELETE" });
}

export function getRetention(userId: string) {
  return apiFetch<RetentionInfo>(`/api/v1/site/team-members/${userId}/retention`);
}

export function purgePersonalData(userId: string) {
  return apiFetch<void>(`/api/v1/site/team-members/${userId}/personal-data`, { method: "DELETE" });
}
