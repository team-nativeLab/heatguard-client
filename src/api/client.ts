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
  if (data === undefined) {

    throw new NetworkError();
  }

  return data as T;
}
