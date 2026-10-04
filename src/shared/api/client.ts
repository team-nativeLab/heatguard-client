// ⚠️ 자동 생성 파일 — heatguard-shared/src 에서 수정한 뒤 `node sync.mjs`로 반영하세요.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

/**
 * 데모 모드: 서버가 없거나 아직 없는 API(404)면 화면에 데모 데이터를 보여준다.
 * - VITE_DEMO_MODE=true/false 로 명시할 수 있고
 * - 지정하지 않으면 개발 서버(npm run dev)에서만 켜지고, 배포 빌드에서는 꺼진다.
 */
export const DEMO_MODE: boolean = (() => {
  const v = import.meta.env.VITE_DEMO_MODE as string | undefined;
  if (v === "true") return true;
  if (v === "false") return false;
  return import.meta.env.DEV;
})();

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

/** 데모 모드에서 서버 대신 데모 데이터/동작으로 대체해야 하는 오류인지 */
export function isDemoFallback(err: unknown): err is NetworkError {
  return DEMO_MODE && err instanceof NetworkError;
}

/** 사용자에게 보여줄 오류 문구 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof NetworkError) return "서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.";
  if (err instanceof ApiError) return err.message;
  return fallback;
}

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

/** 서버 연결 상태가 바뀔 때 발생하는 이벤트. detail: { online: boolean } */
export const CONNECTION_EVENT = "heatguard:connection";
/** 로그인 세션이 만료(401)됐을 때 발생하는 이벤트 */
export const UNAUTHORIZED_EVENT = "heatguard:unauthorized";

let authPaths: string[] = [];

/** 프로젝트별 설정. 로그인/가입 API는 401이어도 세션 만료로 보지 않는다. */
export function configureApiClient(options: { authPaths: string[] }) {
  authPaths = options.authPaths;
}

let lastOnline: boolean | null = null;

function reportConnection(online: boolean) {
  if (lastOnline === online) return;
  lastOnline = online;
  window.dispatchEvent(new CustomEvent(CONNECTION_EVENT, { detail: { online } }));
}

export function getConnectionState() {
  return lastOnline;
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
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function extractMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "message" in data) {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: unknown }).error;
    if (error && typeof error === "object" && "message" in error) {
      const msg = (error as { message?: unknown }).message;
      if (typeof msg === "string" && msg) return msg;
    }
  }
  return fallback;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;

  let res: Response;
  try {
    res = await fetch(buildPath(path, params), {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    reportConnection(false);
    throw new NetworkError();
  }

  const text = await res.text();

  if (!res.ok) {
    const data = text ? safeJsonParse(text) : undefined;
    // 데모 모드에서는 아직 준비되지 않은 API(404)를 데모 데이터로 대체한다.
    if (res.status === 404 && DEMO_MODE) {
      reportConnection(false);
      throw new NetworkError();
    }
    reportConnection(true);
    if (res.status === 401 && !authPaths.includes(path)) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    const fallback = res.status === 404 ? "요청한 정보를 찾을 수 없어요." : `요청에 실패했어요. (${res.status})`;
    throw new ApiError(res.status, extractMessage(data, fallback));
  }

  if (!text) {
    reportConnection(true);
    return undefined as T;
  }

  const data = safeJsonParse(text);
  if (data === undefined) {
    // 백엔드가 없어 개발 서버가 index.html을 돌려준 경우
    reportConnection(false);
    throw new NetworkError();
  }

  reportConnection(true);
  if (data && typeof data === "object" && "success" in data && "data" in data) {
    const envelope = data as { success?: unknown; data?: unknown };
    if (envelope.success === true) return envelope.data as T;
  }
  return data as T;
}
