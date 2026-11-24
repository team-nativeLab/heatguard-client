import { ApiError, apiFetch } from "./client";
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

function normalizeTeamAppLinks(raw: Record<string, unknown> | null | undefined, fallbackTeamId: string): TeamAppLinks {
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
    teamId: typeof raw?.teamId === "string" ? raw.teamId : fallbackTeamId,
    status,
    linkedMemberCount: status === "LINKED" ? items.length : 0,
    items: status === "LINKED" ? items : [],
  };
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
  return normalizeTeamAppLinks(raw, teamId);
}

/** 일괄 조회 API가 없는 서버(배포 전)로 확인되면 이 세션 동안은 다시 시도하지 않는다. */
let batchUnsupported = false;

/**
 * 여러 팀의 연동 상태를 한 번에 가져온다.
 * 일괄 조회(GET /api/v1/site/team-app-links)를 먼저 쓰고, 서버에 아직 없으면(404)
 * 팀별 조회로 되돌아간다. 조회에 실패한 팀은 결과에서 빠진다(화면에서는 색을 칠하지 않는다).
 */
export async function getTeamAppLinksForTeams(teamIds: string[]): Promise<Record<string, TeamAppLinks>> {
  const wanted = new Set(teamIds);
  if (!batchUnsupported) {
    try {
      const raw = await apiFetch<{ items?: unknown[] }>("/api/v1/site/team-app-links");
      const result: Record<string, TeamAppLinks> = {};
      for (const value of raw?.items ?? []) {
        if (!value || typeof value !== "object") continue;
        const record = value as Record<string, unknown>;
        if (typeof record.teamId !== "string" || !wanted.has(record.teamId)) continue;
        result[record.teamId] = normalizeTeamAppLinks(record, record.teamId);
      }
      return result;
    } catch (err) {
      if (!(err instanceof ApiError && (err.status === 404 || err.status === 405))) throw err;
      batchUnsupported = true;
    }
  }
  const results = await Promise.allSettled(teamIds.map((id) => getTeamAppLinks(id)));
  const result: Record<string, TeamAppLinks> = {};
  results.forEach((r, index) => {
    if (r.status === "fulfilled") result[teamIds[index]] = r.value;
  });
  return result;
}
