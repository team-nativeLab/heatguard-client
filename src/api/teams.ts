import { apiFetch } from "./client";
import type { CreateTeamPayload, Page, TeamCredentialsPayload, TeamCredentialsResponse, TeamSummary, UpdateTeamPayload } from "./types";

interface BackendTeam {
  teamId: string;
  name?: string | null;
  leaderName?: string | null;
  workplace?: string | null;
  leaderPhone?: string | null;
  workerCount?: number | null;
  active?: boolean;
  version?: number;
  loginEmail?: string | null;
  memberUserId?: string | null;
}

function normalizeTeam(team: BackendTeam): TeamSummary {
  return {
    id: team.teamId,
    name: team.name ?? `${team.leaderName || "미지정"} 팀`,
    leaderName: team.leaderName ?? "",
    workLocation: team.workplace ?? "",
    contact: team.leaderPhone ?? "",
    memberCount: team.workerCount ?? 0,
    active: team.active ?? true,
    version: team.version ?? 1,
    loginEmail: team.loginEmail,
    memberUserId: team.memberUserId,
  };
}

export function listTeams(params?: { cursor?: string }) {
  return apiFetch<Page<BackendTeam>>("/api/v1/site/teams", { params }).then((page) => ({
    ...page,
    items: page.items.map(normalizeTeam),
  }));
}

export function createTeam(payload: CreateTeamPayload) {
  return apiFetch<BackendTeam>("/api/v1/site/teams", { method: "POST", body: payload }).then(normalizeTeam);
}

export function updateTeam(teamId: string, payload: UpdateTeamPayload) {
  return apiFetch<BackendTeam>(`/api/v1/site/teams/${encodeURIComponent(teamId)}`, { method: "PATCH", body: payload }).then(normalizeTeam);
}

export function deactivateTeam(teamId: string) {
  return apiFetch<void>(`/api/v1/site/teams/${encodeURIComponent(teamId)}`, { method: "DELETE" });
}

export function updateTeamCredentials(teamId: string, payload: TeamCredentialsPayload) {
  return apiFetch<TeamCredentialsResponse>(
    `/api/v1/site/teams/${encodeURIComponent(teamId)}/credentials`,
    { method: "PUT", body: payload },
  );
}
