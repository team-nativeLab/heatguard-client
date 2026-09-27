import { apiFetch } from "./client";
import type { Page, RetentionInfo, TeamMember } from "./types";

export function listTeamMembers(params?: { cursor?: string }) {
  return apiFetch<Page<TeamMember>>("/api/v1/site/teams", { params });
}

export function withdrawTeamMember(userId: string) {
  return apiFetch<void>(`/api/v1/site/teams/${userId}`, { method: "DELETE" });
}

export function getRetention(userId: string) {
  return apiFetch<RetentionInfo>(`/api/v1/site/teams/${userId}/retention`);
}

export function purgePersonalData(userId: string) {
  return apiFetch<void>(`/api/v1/site/teams/${userId}/personal-data`, { method: "DELETE" });
}
