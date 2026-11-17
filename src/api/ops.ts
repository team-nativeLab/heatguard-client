import { apiFetch } from "./client";

/*
 * 운영자(SUPPORT_OPERATOR) 콘솔 API.
 * 운영자는 통합 관리자 로그인(/auth/admin/login)이 받아주지 않으므로 전용 경로를 쓴다.
 * 세션 쿠키도 본사·현장과 별도(hg_ops_session)다.
 */

export type OpsInquiryStatus = "OPEN" | "ANSWERED" | "CLOSED";

export interface OpsUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  version: number;
  expiresAt?: string;
}

export interface OpsReply {
  replyId: string;
  content: string;
  answeredAt?: string;
  deliveryStatus?: string;
}

export interface OpsInquiry {
  inquiryId: string;
  title: string;
  content: string;
  status: OpsInquiryStatus;
  version: number;
  createdAt?: string;
  updatedAt?: string;
  replies: OpsReply[];
}

type Raw = Record<string, unknown>;

const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const num = (value: unknown, fallback = 1) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

function toStatus(value: unknown): OpsInquiryStatus {
  return value === "ANSWERED" || value === "CLOSED" ? value : "OPEN";
}

function toReply(raw: unknown): OpsReply | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Raw;
  const content = str(r.content);
  if (!content) return null;
  return { replyId: str(r.replyId), content, answeredAt: str(r.answeredAt) || undefined, deliveryStatus: str(r.deliveryStatus) || undefined };
}

function toInquiry(raw: unknown): OpsInquiry {
  const r = (raw && typeof raw === "object" ? raw : {}) as Raw;
  const replies = Array.isArray(r.replies) ? r.replies.map(toReply).filter((x): x is OpsReply => x !== null) : [];
  return {
    inquiryId: str(r.inquiryId),
    title: str(r.title, "(제목 없음)"),
    content: str(r.content),
    status: toStatus(r.status),
    version: num(r.version),
    createdAt: str(r.createdAt) || undefined,
    updatedAt: str(r.updatedAt) || undefined,
    replies,
  };
}

/* ───────────── 인증 ───────────── */

export function login(payload: { email: string; password: string }) {
  return apiFetch<{ user: { userId: string; name: string; role: string }; expiresAt: string }>(
    "/api/v1/ops/auth/login",
    { method: "POST", body: payload },
  );
}

export function logout() {
  return apiFetch<void>("/api/v1/ops/auth/logout", { method: "POST" });
}

export function me() {
  return apiFetch<OpsUser>("/api/v1/ops/auth/me");
}

/* ───────────── 민원 ───────────── */

interface PageResponse {
  items?: unknown[];
  page?: { nextCursor?: string | null; hasMore?: boolean };
}

/** 탭 개수를 정확히 보여주려면 전체가 필요하다. 운영 규모에서 과도한 요청을 막기 위해 상한을 둔다. */
const MAX_PAGES = 10;

export async function listInquiries(): Promise<{ items: OpsInquiry[]; truncated: boolean }> {
  const items: OpsInquiry[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const res = await apiFetch<PageResponse>("/api/v1/ops/inquiries", { params: { limit: 100, cursor } });
    items.push(...(res.items ?? []).map(toInquiry));
    cursor = res.page?.nextCursor ?? undefined;
    if (!cursor) return { items, truncated: false };
  }
  return { items, truncated: true };
}

export async function getInquiry(inquiryId: string) {
  return toInquiry(await apiFetch<unknown>(`/api/v1/ops/inquiries/${encodeURIComponent(inquiryId)}`));
}

/**
 * closeAfterReply가 true면 서버가 상태를 CLOSED로, 아니면 ANSWERED로 바꾼다.
 * 같은 답변을 재시도할 때는 같은 idempotencyKey를 보내야 서버가 중복 저장하지 않는다.
 * (키를 모르는 이전 서버는 헤더를 무시하므로 함께 보내도 안전하다.)
 */
export function replyToInquiry(inquiryId: string, content: string, closeAfterReply: boolean, idempotencyKey?: string) {
  return apiFetch<{ replyId: string; inquiryId: string; deliveryStatus: string; createdAt: string }>(
    `/api/v1/ops/inquiries/${encodeURIComponent(inquiryId)}/replies`,
    {
      method: "POST",
      body: { content, closeAfterReply },
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    },
  );
}

export async function updateInquiryStatus(inquiryId: string, status: OpsInquiryStatus, version: number) {
  return toInquiry(
    await apiFetch<unknown>(`/api/v1/ops/inquiries/${encodeURIComponent(inquiryId)}/status`, {
      method: "PATCH",
      body: { status, version },
    }),
  );
}
