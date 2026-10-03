export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class NetworkError extends Error {
  constructor(message = "서버에 연결할 수 없어요.") {
    super(message);
    this.name = "NetworkError";
  }
}

export function isNetworkError(err: unknown): err is NetworkError {
  return err instanceof NetworkError;
}

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

function buildPath(path: string, params?: RequestOptions["params"]) {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ""}`;
}

function safeJsonParse(text: string): unknown {
  try { return JSON.parse(text); } catch { return undefined; }
}

function extractMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "message" in data) {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  return fallback;
}

const MOCK = false;

const records = [
  { id: "r1", type: "온도계", place: "3층 외벽", temperature: 36, humidity: 65, apparentTemperature: 36.2, time: "09:02" },
  { id: "r2", type: "작업사진", place: "지하 배관", temperature: 34, humidity: 72, apparentTemperature: 34.5, time: "10:30" },
  { id: "r3", type: "휴식사진", place: "옥상 그늘막", temperature: 38, humidity: 80, apparentTemperature: 38.7, time: "12:05" },
  { id: "r4", type: "온도계", place: "3층 외벽", temperature: 35, humidity: 60, apparentTemperature: 35.1, time: "14:00" },
];

function mockResponse(path: string, method: Method, body?: unknown): unknown {
  if (path === "/api/v1/auth/site/login") {
    return { user: { userId: "demo-user", name: "김철수", email: "hq@example.com", role: "SITE_MANAGER", siteId: "site-demo" } };
  }
  if (path === "/api/v1/auth/site/me") {
    return { userId: "demo-user", name: "김철수", email: "hq@example.com", role: "SITE_MANAGER", siteId: "site-demo" };
  }
  if (path === "/api/v1/site/profile") {
    if (method === "PATCH") return { id: "site-demo", version: 1, createdAt: "2026-09-01T09:00:00Z", updatedAt: new Date().toISOString() };
    return { siteId: "site-demo", siteName: "인천 복합물류센터", manager: { name: "김철수", phone: "010-1234-5678" } };
  }
  if (path === "/api/v1/site/dashboard") {
    return {
      summary: { teamCount: 4, todayRecordCount: records.length, activeEmergencyCount: 1 },
      weather: { temperature: 36.2, humidity: 65, feelsLike: 36.2, condition: "맑음" },
      heatLevel: "경보",
    };
  }
  if (path === "/api/v1/site/records" || path.startsWith("/api/v1/site/records?")) {
    return { items: records, page: { nextCursor: null, hasMore: false } };
  }
  if (path.startsWith("/api/v1/site/records/")) {
    const id = path.split("/").pop();
    return { id, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), record: records.find(r => r.id === id) ?? records[0] };
  }
  if (path === "/api/v1/site/emergency-calls/active") return { items: [] };
  if (path === "/api/v1/site/teams" || path.startsWith("/api/v1/site/teams?")) {
    return { items: [
      { id: "team-1", leaderName: "이민수", workLocation: "3층 외벽", contact: "010-1111-2222", memberCount: 6, accessUrl: "https://example.com/team/1", active: true },
      { id: "team-2", leaderName: "박지훈", workLocation: "지하 배관", contact: "010-2222-3333", memberCount: 5, accessUrl: "https://example.com/team/2", active: true },
      { id: "team-3", leaderName: "최서윤", workLocation: "옥상", contact: "010-3333-4444", memberCount: 4, accessUrl: "https://example.com/team/3", active: true },
    ], page: { nextCursor: null, hasMore: false } };
  }
  if (path === "/api/v1/site/team-members" || path.startsWith("/api/v1/site/team-members?")) {
    return { items: [
      { id: "member-1", name: "이민수", teamId: "team-1", teamName: "A팀", active: true },
      { id: "member-2", name: "박지훈", teamId: "team-2", teamName: "B팀", active: true },
      { id: "member-3", name: "최서윤", teamId: "team-3", teamName: "C팀", active: true },
    ], page: { nextCursor: null, hasMore: false } };
  }
  if (path === "/api/v1/site/checklist-items") {
    return { items: [
      { id: "c1", text: "식수 비치 여부 확인", sortOrder: 1, active: true },
      { id: "c2", text: "그늘막 설치 여부 확인", sortOrder: 2, active: true },
      { id: "c3", text: "근로자 건강상태 확인", sortOrder: 3, active: true },
      { id: "c4", text: "옥외작업 자제", sortOrder: 4, active: true },
      { id: "c5", text: "2시간마다 휴식", sortOrder: 5, active: true },
    ] };
  }
  if (path === "/api/v1/site/check-times") {
    return method === "PUT" ? { times: (body as { times: string[] })?.times ?? ["10:00","12:00","14:00","16:00"], updatedAt: new Date().toISOString() } : { times: ["10:00","12:00","14:00","16:00"], updatedAt: new Date().toISOString() };
  }
  if (path === "/api/v1/site/manual-weather") return method === "PUT" ? body : { temperature: 36.2, humidity: 65, apparentTemperature: 36.2 };
  if (path === "/api/v1/site/print-summary") return { date: new Date().toISOString().slice(0,10), site: { siteName: "인천 복합물류센터", address: "인천광역시", managerName: "김철수" }, weather: { temperature: 36.2, humidity: 65, feelsLike: 36.2, condition: "맑음" }, records, teamsChecklist: [{ teamName: "A팀", completed: 5, total: 5 }, { teamName: "B팀", completed: 4, total: 5 }], approvalLine: [{ role: "현장관리자", name: "김철수", approved: true }] };
  if (path === "/api/v1/site/inquiries") return method === "GET" ? { items: [], page: { nextCursor: null, hasMore: false } } : { inquiryId: "inq-demo", title: "문의", content: "", status: "OPEN", createdAt: new Date().toISOString() };
  if (method !== "GET") return {};
  return {};
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;

  if (MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    return mockResponse(path, method, body) as T;
  }

  let res: Response;
  try {
    res = await fetch(buildPath(path, params), {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new NetworkError();
  }

  const text = await res.text();
  if (!res.ok) {
    if (res.status === 404) throw new NetworkError();
    const data = text ? safeJsonParse(text) : undefined;
    throw new ApiError(res.status, extractMessage(data, `요청에 실패했어요. (${res.status})`));
  }
  if (!text) return undefined as T;
  const data = safeJsonParse(text);
  if (data === undefined) throw new NetworkError();
  return data as T;
}
