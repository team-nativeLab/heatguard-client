import { apiFetch } from "./client";
import type { Page } from "./types";

/* ───────────── 본사 관리자 API (/api/v1/auth/hq/*, /api/v1/hq/*) ───────────── */

export interface HqUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  scopeId: string;
  expiresAt?: string;
}

export interface HqProfile {
  companyId: string;
  companyName: string;
  phone: string | null;
}

export interface HqLoginResponse {
  user: { userId: string; name: string; role: string };
  companyId: string;
  expiresAt: string;
}

export interface HqRegisterPayload {
  verificationCode: string;
  companyName: string;
  managerName: string;
  email: string;
  password: string;
}

export function login(payload: { email: string; password: string }) {
  return apiFetch<HqLoginResponse>("/api/v1/auth/hq/login", { method: "POST", body: payload });
}

export function register(payload: HqRegisterPayload) {
  return apiFetch<{ companyId: string; userId: string; createdAt?: string }>("/api/v1/auth/hq/register", {
    method: "POST",
    body: payload,
  });
}

export function logout() {
  return apiFetch<void>("/api/v1/auth/hq/logout", { method: "POST", body: {} });
}

export function me() {
  return apiFetch<HqUser>("/api/v1/auth/hq/me");
}

export function changePassword(payload: { currentPassword: string; newPassword: string }) {
  return apiFetch<{ changedAt: string }>("/api/v1/auth/hq/password", { method: "PUT", body: payload });
}

export function getProfile() {
  return apiFetch<HqProfile>("/api/v1/hq/profile");
}

/** phone 빈 문자열이면 연락처 해제 */
export function updateProfile(payload: { phone: string }) {
  return apiFetch<HqProfile>("/api/v1/hq/profile", { method: "PATCH", body: payload });
}

/* ───────────── 데이터 정규화 (응답 필드가 일부 달라도 화면이 깨지지 않게) ───────────── */

type Raw = Record<string, unknown>;

function isObj(v: unknown): v is Raw {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** "a", "a.b" 경로 중 처음 값이 있는 것을 돌려준다 */
function get(raw: Raw | undefined, ...paths: string[]): unknown {
  if (!raw) return undefined;
  for (const path of paths) {
    let cur: unknown = raw;
    for (const key of path.split(".")) {
      if (!isObj(cur)) {
        cur = undefined;
        break;
      }
      cur = cur[key];
    }
    if (cur !== undefined && cur !== null) return cur;
  }
  return undefined;
}

function str(raw: Raw | undefined, ...paths: string[]): string {
  const v = get(raw, ...paths);
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}

function num(raw: Raw | undefined, ...paths: string[]): number | null {
  const v = get(raw, ...paths);
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/** 위험단계: 0 미입력 · 1 주의보 · 2 경보 · 3 중대경보 */
export type HeatLevel = 0 | 1 | 2 | 3;
export type HeatTone = "red" | "orange" | "yellow" | "none";

export const HEAT_LABEL: Record<HeatLevel, string> = {
  0: "미입력",
  1: "폭염 주의보",
  2: "폭염 경보",
  3: "폭염 중대경보",
};
export const HEAT_TONE: Record<HeatLevel, HeatTone> = { 0: "none", 1: "yellow", 2: "orange", 3: "red" };

function toHeatLevel(v: number | null): HeatLevel {
  if (v == null) return 0;
  return Math.max(0, Math.min(3, Math.round(v))) as HeatLevel;
}

export interface HqSite {
  id: string;
  name: string;
  managerName: string;
  managerEmail: string;
  heatLevel: HeatLevel;
  managerPhone: string;
  /** 현재 현장 온도(°C). 미입력이면 null */
  temperature: number | null;
  checklistDone: number | null;
  checklistTotal: number | null;
  todayRecordCount: number;
  teamCount: number | null;
  emergency: boolean;
  active: boolean;
}

export function normalizeSite(raw: unknown): HqSite {
  const r: Raw = isObj(raw) ? raw : {};
  return {
    id: str(r, "siteId", "id"),
    name: str(r, "siteName", "name", "site.name") || "(이름 없음)",
    managerName: str(r, "managerName", "manager.name", "manager"),
    managerEmail: str(r, "managerEmail", "manager.email", "loginEmail", "email"),
    managerPhone: str(r, "managerPhone", "manager.phone"),
    heatLevel: toHeatLevel(num(r, "heatLevel", "riskLevel", "heat.level")),
    temperature: num(r, "temperature", "currentTemperature", "maxTemperature", "weather.temperature", "manualWeather.temperature"),
    checklistDone: num(r, "checklistDone", "checklist.done", "checklistProgress.done", "completedCount"),
    checklistTotal: num(r, "checklistTotal", "checklist.total", "checklistProgress.total", "totalCount"),
    todayRecordCount: num(r, "todayRecordCount", "recordCount", "todayRecords") ?? 0,
    teamCount: num(r, "teamCount", "teamsCount"),
    emergency: get(r, "hasActiveEmergency", "emergency", "activeEmergency") === true || (num(r, "activeEmergencyCount") ?? 0) > 0,
    active: get(r, "active") !== false,
  };
}

export interface HqEmergencyCall {
  callId: string;
  siteId: string;
  siteName: string;
  teamName: string;
  status: string;
  createdAt: string;
}

function normalizeCall(raw: unknown): HqEmergencyCall {
  const r: Raw = isObj(raw) ? raw : {};
  return {
    callId: str(r, "callId", "id"),
    siteId: str(r, "siteId"),
    siteName: str(r, "siteName"),
    teamName: str(r, "teamName"),
    status: str(r, "status"),
    createdAt: str(r, "createdAt"),
  };
}

export interface HqDashboard {
  summary: { siteCount: number; dangerSiteCount: number; todayRecordCount: number; activeEmergencyCount: number };
  weather: { temperature: number | null; humidity: number | null; apparentTemperature: number | null; sky: string };
  heatLevel: HeatLevel | null;
  sitesByRisk: HqSite[];
  activeEmergencyCalls: HqEmergencyCall[];
}

export async function getDashboard(): Promise<HqDashboard> {
  const raw = await apiFetch<unknown>("/api/v1/hq/dashboard");
  const r: Raw = isObj(raw) ? raw : {};
  const calls = Array.isArray(r.activeEmergencyCalls) ? r.activeEmergencyCalls.map(normalizeCall) : [];
  const sites = Array.isArray(r.sitesByRisk) ? r.sitesByRisk.map(normalizeSite) : [];
  const heat = num(r, "heatLevel");
  return {
    summary: {
      siteCount: num(r, "summary.siteCount") ?? sites.length,
      dangerSiteCount: num(r, "summary.dangerSiteCount") ?? 0,
      todayRecordCount: num(r, "summary.todayRecordCount") ?? 0,
      activeEmergencyCount: num(r, "summary.activeEmergencyCount") ?? calls.length,
    },
    weather: {
      temperature: num(r, "weather.temperature", "weather.temp"),
      humidity: num(r, "weather.humidity"),
      apparentTemperature: num(r, "weather.apparentTemperature", "weather.feelsLike"),
      sky: str(r, "weather.skyStatus", "weather.sky", "weather.condition"),
    },
    heatLevel: heat == null ? null : toHeatLevel(heat),
    sitesByRisk: sites,
    activeEmergencyCalls: calls,
  };
}

export async function listSites(params?: { heatLevel?: number; emergency?: boolean; cursor?: string; limit?: number }) {
  const page = await apiFetch<Page<unknown>>("/api/v1/hq/sites", { params });
  return { ...page, items: (page?.items ?? []).map(normalizeSite) };
}

/** 모든 페이지를 이어서 가져온다 (현장 수가 많지 않다는 전제) */
export async function listAllSites(params?: { heatLevel?: number; emergency?: boolean }) {
  const items: HqSite[] = [];
  let cursor: string | undefined;
  do {
    const res = await listSites({ ...params, cursor, limit: 100 });
    items.push(...res.items);
    cursor = res.page?.nextCursor ?? undefined;
  } while (cursor);
  return items;
}

export interface CreateHqSitePayload {
  siteName: string;
  managerName: string;
  managerPhone: string;
  managerEmail?: string;
  initialPassword?: string;
}

export function createSite(payload: CreateHqSitePayload) {
  return apiFetch<{ siteId: string; managerUserId?: string; defaultTeamId?: string }>("/api/v1/hq/sites", {
    method: "POST",
    body: payload,
  });
}

export function deactivateSite(siteId: string) {
  return apiFetch<void>(`/api/v1/hq/sites/${encodeURIComponent(siteId)}`, { method: "DELETE" });
}

export interface TeamInvitation {
  inviteUrl: string;
}

export function createTeamInvitation(siteId: string, teamId: string) {
  return apiFetch<TeamInvitation>(
    `/api/v1/hq/sites/${encodeURIComponent(siteId)}/teams/${encodeURIComponent(teamId)}/invitations`,
    { method: "POST" },
  );
}

export interface HqRecordRow {
  id: string;
  type: "온도계" | "작업사진" | "휴식사진";
  place: string;
  temperature: number | null;
  humidity: number | null;
  apparentTemperature: number | null;
  time: string;
  photoUrls: string[];
  photoCount: number;
  siteId: string;
  siteName: string;
  teamName: string;
}

const RECORD_TYPES: Record<string, HqRecordRow["type"]> = { THERMOMETER: "온도계", WORK: "작업사진", REST: "휴식사진" };

const hhmm = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function normalizeRecord(raw: unknown): HqRecordRow {
  const r: Raw = isObj(raw) ? raw : {};
  const measuredAt = str(r, "measuredAt", "createdAt");
  const d = new Date(measuredAt);
  const photoUrls = Array.isArray(r.photoUrls) ? r.photoUrls.filter((u): u is string => typeof u === "string") : [];
  const photoKeys = Array.isArray(r.photoKeys) ? r.photoKeys.length : 0;
  return {
    id: str(r, "recordId", "id"),
    type: RECORD_TYPES[str(r, "type")] ?? "온도계",
    place: str(r, "workplace", "place"),
    temperature: num(r, "temperature"),
    humidity: num(r, "humidity"),
    apparentTemperature: num(r, "apparentTemperature"),
    time: Number.isNaN(d.getTime()) ? measuredAt : hhmm.format(d),
    photoUrls,
    photoCount: Math.max(photoUrls.length, photoKeys),
    siteId: str(r, "siteId"),
    siteName: str(r, "siteName"),
    teamName: str(r, "teamName"),
  };
}

export async function listRecords(params?: { date?: string; siteId?: string; cursor?: string; limit?: number }) {
  const page = await apiFetch<Page<unknown>>("/api/v1/hq/records", { params });
  return { ...page, items: (page?.items ?? []).map(normalizeRecord) };
}

export interface HqSiteDetail {
  site: { id: string; name: string; active: boolean; managerName: string; managerEmail: string; managerPhone: string; heatLevel: HeatLevel; temperature: number | null };
  teams: { id: string; name: string; leaderName: string; workplace: string; memberCount: number | null; done: number | null; total: number | null }[];
  checklistItems: { id: string; text: string }[];
  todayRecords: HqRecordRow[];
}

export async function getSite(siteId: string): Promise<HqSiteDetail> {
  const raw = await apiFetch<unknown>(`/api/v1/hq/sites/${encodeURIComponent(siteId)}`);
  const r: Raw = isObj(raw) ? raw : {};
  const site = normalizeSite(isObj(r.site) ? { ...r.site, ...(isObj(r.summary) ? r.summary : {}) } : r);
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    site: {
      id: site.id || siteId,
      name: site.name,
      active: site.active,
      managerName: site.managerName,
      managerEmail: site.managerEmail,
      managerPhone: site.managerPhone,
      heatLevel: site.heatLevel,
      temperature: site.temperature,
    },
    teams: arr(r.teams).map((t) => {
      const tr: Raw = isObj(t) ? t : {};
      return {
        id: str(tr, "teamId", "id"),
        name: str(tr, "name", "teamName") || "(이름 없음)",
        leaderName: str(tr, "leaderName", "leader.name"),
        workplace: str(tr, "workplace", "workLocation"),
        memberCount: num(tr, "memberCount", "headcount"),
        done: num(tr, "checklistDone", "checklist.done", "completedCount"),
        total: num(tr, "checklistTotal", "checklist.total", "totalCount"),
      };
    }),
    checklistItems: arr(r.checklistItems).map((c) => {
      const cr: Raw = isObj(c) ? c : {};
      return { id: str(cr, "itemId", "id"), text: str(cr, "text", "title") };
    }),
    todayRecords: arr(r.todayRecords).map(normalizeRecord),
  };
}

export async function listActiveEmergencyCalls() {
  const page = await apiFetch<Page<unknown>>("/api/v1/hq/emergency-calls/active");
  return (page?.items ?? []).map(normalizeCall);
}
