import { apiFetch } from "./client";
import type { CreateTeamPayload, Page, TeamCredentialsPayload, TeamCredentialsResponse, TeamSummary, UpdateTeamPayload } from "./types";

interface BackendTeam {
  teamId: string;
  name?: string | null;
  leaderName?: string | null;
  workplace?: string | null;
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

export interface TeamInvitation {
  inviteUrl: string;
}

export function createTeamInvitation(teamId: string) {
  return apiFetch<TeamInvitation>(
    `/api/v1/site/teams/${encodeURIComponent(teamId)}/invitations`,
    { method: "POST" },
  );
}

export type TeamAppLinkStatus = "LINKED" | "UNLINKED";

export interface TeamAppLinkMember {
  userId: string;
  name: string;
  email: string;
  linkedAt: string;
}

export interface TeamAppLinks {
  teamId: string;
  status: TeamAppLinkStatus;
  linkedMemberCount: number;
  items: TeamAppLinkMember[];
}

/**
 * 팀 앱 연동 상태. 실제로 초대를 수락해 활성 소속이 된 작업자만 LINKED로 센다.
 * 초대 링크 발급이나 팀 생성 시 자동으로 만들어지는 계정(memberUserId)은 연동이 아니다.
 * 앱 설치 여부나 현재 온라인 상태를 뜻하지 않는다.
 */
export async function getTeamAppLinks(teamId: string): Promise<TeamAppLinks> {
  const raw = await apiFetch<Record<string, unknown>>(
    `/api/v1/site/teams/${encodeURIComponent(teamId)}/app-links`,
  );
  const items = Array.isArray(raw?.items)
    ? raw.items.flatMap((value): TeamAppLinkMember[] => {
        if (!value || typeof value !== "object") return [];
        const item = value as Record<string, unknown>;
        if (item.status !== "LINKED" || typeof item.userId !== "string") return [];
        return [{
          userId: item.userId,
          name: typeof item.name === "string" ? item.name : "",
          email: typeof item.email === "string" ? item.email : "",
          linkedAt: typeof item.linkedAt === "string" ? item.linkedAt : "",
        }];
      })
    : [];
  // 계약상 data.status가 LINKED일 때만 연동으로 표시한다. 그 외 값은 미연동으로 본다.
  const status: TeamAppLinkStatus = raw?.status === "LINKED" ? "LINKED" : "UNLINKED";
  return {
    teamId: typeof raw?.teamId === "string" ? raw.teamId : teamId,
    status,
    linkedMemberCount: status === "LINKED" ? items.length : 0,
    items: status === "LINKED" ? items : [],
  };
}
