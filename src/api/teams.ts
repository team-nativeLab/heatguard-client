import { apiFetch } from "./client";
import type { CreateTeamPayload, Page, TeamSummary, TokenRotationResponse, UpdateTeamPayload } from "./types";

export function listTeams(params?: { cursor?: string }) {
  return apiFetch<Page<TeamSummary>>("/api/v1/site/teams", { params });
}

export function createTeam(payload: CreateTeamPayload) {
  return apiFetch<TeamSummary>("/api/v1/site/teams", { method: "POST", body: payload });
}

export function updateTeam(teamId: string, payload: UpdateTeamPayload) {
  return apiFetch<TeamSummary>(`/api/v1/site/teams/${teamId}`, { method: "PATCH", body: payload });
}

export function deactivateTeam(teamId: string) {
  return apiFetch<void>(`/api/v1/site/teams/${teamId}`, { method: "DELETE" });
}

export function rotateTeamToken(teamId: string) {
  return apiFetch<TokenRotationResponse>(`/api/v1/site/teams/${teamId}/token-rotation`, { method: "POST" });
}
