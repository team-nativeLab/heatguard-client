import type { OpsInquiry, OpsInquiryStatus } from "../api";

/** 답변 본문 최대 길이 (Figma 기준 1000자) */
export const REPLY_MAX_LENGTH = 1000;

export type InquiryTab = "all" | "open" | "done";

export const STATUS_LABEL: Record<OpsInquiryStatus, string> = {
  OPEN: "답변 대기",
  ANSWERED: "답변 완료",
  CLOSED: "종료",
};

export function matchesTab(status: OpsInquiryStatus, tab: InquiryTab) {
  if (tab === "open") return status === "OPEN";
  if (tab === "done") return status !== "OPEN";
  return true;
}

/**
 * 서버에 문의 유형 필드가 없다. 디자인처럼 제목이 "[기능 문의] …" 형식이면
 * 대괄호 안을 유형으로 쓰고, 아니면 "기타"로 묶는다.
 */
export function inquiryType(title: string): string {
  const match = /^\s*\[([^\]]{1,20})\]/.exec(title);
  return match ? match[1].trim() : "기타";
}

/** "2시간 전", "3일 전" 처럼 상대 시간. 7일이 넘으면 날짜로 보여준다. */
export function relativeTime(iso: string | undefined, now = Date.now()): string {
  if (!iso) return "";
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "";
  const minutes = Math.floor((now - time) / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return formatDateTime(iso, false);
}

export function formatDateTime(iso: string | undefined, withTime = true): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const ymd = `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
  if (!withTime) return ymd;
  return `${ymd} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** 운영팀이 자주 쓰는 답변. 삽입 후 상황에 맞게 고쳐 쓴다. */
export const REPLY_TEMPLATES: { label: string; body: string }[] = [
  {
    label: "업로드 오류 안내",
    body: "안녕하세요, 폭염가드 운영팀입니다.\n말씀하신 업로드 오류를 확인했습니다. 앱을 최신 버전으로 업데이트한 뒤 실패한 사진을 다시 올려 주세요. 같은 문제가 계속되면 발생 시각과 현장명을 알려주시면 바로 확인하겠습니다.",
  },
  {
    label: "현장 등록 방법",
    body: "안녕하세요, 폭염가드 운영팀입니다.\n현장은 현장 관리자 계정으로 로그인한 뒤 현장 관리 화면에서 등록할 수 있습니다. 본사 소속이라면 본사 관리자가 현장 관리 메뉴에서 현장을 추가하고 현장 관리자를 초대해 주세요.",
  },
  {
    label: "담당자 변경 안내",
    body: "안녕하세요, 폭염가드 운영팀입니다.\n담당자 변경은 계정 설정에서 이메일과 연락처를 수정해 진행할 수 있습니다. 계정 자체를 다른 분께 넘기셔야 한다면 새 담당자 정보를 회신해 주세요.",
  },
];

/* ───────────── 임시 저장 (브라우저에만 보관) ───────────── */

const DRAFT_KEY = (inquiryId: string) => `heatguard.ops.draft.${inquiryId}`;

export function loadDraft(inquiryId: string): string {
  try {
    return window.localStorage.getItem(DRAFT_KEY(inquiryId)) ?? "";
  } catch {
    return "";
  }
}

export function saveDraft(inquiryId: string, content: string) {
  try {
    if (content.trim()) window.localStorage.setItem(DRAFT_KEY(inquiryId), content);
    else window.localStorage.removeItem(DRAFT_KEY(inquiryId));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(inquiryId: string) {
  try {
    window.localStorage.removeItem(DRAFT_KEY(inquiryId));
  } catch {
    // 저장소를 쓸 수 없는 환경이면 지울 것도 없다.
  }
}

export function isOpen(inquiry: OpsInquiry) {
  return inquiry.status === "OPEN";
}

/**
 * 답변 전송 실패가 "실제로는 저장됐을 수도 있는" 종류인지.
 * - 응답을 못 받은 네트워크 오류: 요청이 서버에 도달해 저장됐을 수 있다.
 * - 5xx (예: 503 SERVICE_DEGRADED): 서버 계약상 이벤트 전송만 실패하고 저장은 됐을 수 있다.
 * - 4xx (400·404·409): 서버가 거부했으므로 저장되지 않았다.
 */
export function mayHaveBeenSaved(failure: { network?: boolean; status?: number }): boolean {
  if (failure.network) return true;
  return typeof failure.status === "number" && failure.status >= 500;
}

/**
 * 같은 문의에 같은 내용·같은 완료 표시로 다시 보낼 때는 이전 키를 재사용하고,
 * 하나라도 다르면 새 키를 만든다. 서버는 같은 키의 재요청을 중복 저장하지 않으며,
 * 같은 키에 내용이나 closeAfterReply가 다르면 409 IDEMPOTENCY_KEY_REUSED로 거부한다.
 */
export interface PendingReplyKey {
  inquiryId: string;
  content: string;
  closeAfterReply: boolean;
  key: string;
}

export function replyKeyFor(
  pending: PendingReplyKey | null,
  inquiryId: string,
  content: string,
  closeAfterReply: boolean,
  createKey: () => string,
): PendingReplyKey {
  const text = content.trim();
  if (pending && pending.inquiryId === inquiryId && pending.content === text && pending.closeAfterReply === closeAfterReply) {
    return pending;
  }
  return { inquiryId, content: text, closeAfterReply, key: createKey() };
}

/**
 * 저장 여부가 불확실한 전송이 남아 있으면, 같은 문의·같은 내용의 재시도는 그때의
 * 완료 표시로 보내야 서버가 저장된 답변을 돌려준다. 이때 고정할 값을 반환한다.
 */
export function lockedCloseAfterReply(
  pending: PendingReplyKey | null,
  inquiryId: string | undefined,
  content: string,
): boolean | null {
  if (!pending || pending.inquiryId !== inquiryId || pending.content !== content.trim()) return null;
  return pending.closeAfterReply;
}

export function newIdempotencyKey(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `reply-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * 다시 조회했을 때 내가 보낸 내용과 같은 답변이 늘었으면 이전 요청이 저장된 것이다.
 * 개수만 비교하면 그 사이 다른 운영자가 단 답변을 내 답변으로 오인한다.
 */
export function replyLanded(
  before: { content: string }[],
  after: { content: string }[],
  content: string,
): boolean {
  const target = content.trim();
  const count = (list: { content: string }[]) => list.filter((r) => r.content.trim() === target).length;
  return count(after) > count(before);
}

/* ───────────── 대시보드 집계 ───────────── */

export interface InquirySummary {
  total: number;
  open: number;
  answered: number;
  closed: number;
  /** 최근 접수 순 (createdAt 내림차순) */
  recent: OpsInquiry[];
}

/** 대시보드 지표. 서버에 통계 API가 없어 문의 목록에서 직접 센다. */
export function summarizeInquiries(items: OpsInquiry[], recentLimit = 5): InquirySummary {
  const count = (status: OpsInquiry["status"]) => items.filter((i) => i.status === status).length;
  const recent = [...items]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, recentLimit);
  return { total: items.length, open: count("OPEN"), answered: count("ANSWERED"), closed: count("CLOSED"), recent };
}
