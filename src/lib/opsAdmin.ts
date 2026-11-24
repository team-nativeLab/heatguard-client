/*
 * 운영자 콘솔 중 서버 API가 아직 없는 화면(회원 관리·가입 승인·활동 로그)의 데이터 계약.
 * 서버 팀에 요청한 계약(docs/ops-console-api-request.md)과 같은 모양이다.
 * 서버가 아직 없으면(404) 화면은 "서버 준비 중"을 보여주고, 생기면 그대로 붙는다.
 */

type Raw = Record<string, unknown>;

const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const optStr = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const count = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
const optCount = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : undefined);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly unknown[]).includes(v) ? (v as T) : fallback;
const list = (v: unknown) => (Array.isArray(v) ? v : []);

export interface PageInfo {
  nextCursor?: string;
}

const pageOf = (raw: Raw): PageInfo => ({ nextCursor: optStr(obj(raw.page).nextCursor) });

/* ───────────── 회원 관리 (회사) ───────────── */

export const COMPANY_STATUSES = ["ACTIVE", "SUSPENDED", "WITHDRAWN"] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export const COMPANY_STATUS_LABEL: Record<CompanyStatus, string> = {
  ACTIVE: "이용 중",
  SUSPENDED: "정지",
  WITHDRAWN: "탈퇴",
};

export interface OpsCompany {
  companyId: string;
  name: string;
  businessNumber?: string;
  managerName?: string;
  email?: string;
  joinedAt?: string;
  siteCount: number;
  recordCount: number;
  lastActivityAt?: string;
  status: CompanyStatus;
}

export interface CompanyCounts {
  all: number;
  active: number;
  suspended: number;
  withdrawn: number;
}

export const SITE_HEALTH = ["NORMAL", "CAUTION", "NO_INPUT"] as const;
export type SiteHealth = (typeof SITE_HEALTH)[number];
export const SITE_HEALTH_LABEL: Record<SiteHealth, string> = { NORMAL: "정상", CAUTION: "주의", NO_INPUT: "미입력" };

export interface OpsCompanyDetail extends OpsCompany {
  planName?: string;
  managerPhone?: string;
  managerTeam?: string;
  monthlyLogins?: number;
  sites: { siteId: string; name: string; recordCount: number; health: SiteHealth }[];
  recentActivities: { message: string; at?: string }[];
}

export function normalizeCompany(raw: unknown): OpsCompany {
  const r = obj(raw);
  return {
    companyId: str(r.companyId),
    name: str(r.name, "(이름 없음)"),
    businessNumber: optStr(r.businessNumber),
    managerName: optStr(r.managerName),
    email: optStr(r.email),
    joinedAt: optStr(r.joinedAt),
    siteCount: count(r.siteCount),
    recordCount: count(r.recordCount),
    lastActivityAt: optStr(r.lastActivityAt),
    status: oneOf(r.status, COMPANY_STATUSES, "ACTIVE"),
  };
}

export function normalizeCompanyPage(raw: unknown) {
  const r = obj(raw);
  const c = obj(r.counts);
  const items = list(r.items).map(normalizeCompany).filter((i) => i.companyId);
  const counts: CompanyCounts = {
    all: count(c.all),
    active: count(c.active),
    suspended: count(c.suspended),
    withdrawn: count(c.withdrawn),
  };
  return { items, counts, page: pageOf(r) };
}

export function normalizeCompanyDetail(raw: unknown): OpsCompanyDetail {
  const r = obj(raw);
  return {
    ...normalizeCompany(r),
    planName: optStr(r.planName),
    managerPhone: optStr(r.managerPhone),
    managerTeam: optStr(r.managerTeam),
    monthlyLogins: optCount(r.monthlyLogins),
    sites: list(r.sites).map((s) => {
      const x = obj(s);
      return { siteId: str(x.siteId), name: str(x.name, "(이름 없음)"), recordCount: count(x.recordCount), health: oneOf(x.health, SITE_HEALTH, "NORMAL") };
    }),
    recentActivities: list(r.recentActivities).map((a) => {
      const x = obj(a);
      return { message: str(x.message), at: optStr(x.at) };
    }).filter((a) => a.message),
  };
}

/* ───────────── 가입 승인 ───────────── */

export const SIGNUP_STATUSES = ["PENDING_APPROVAL", "PENDING_DEPOSIT", "ACTIVE", "REJECTED"] as const;
export type SignupStatus = (typeof SIGNUP_STATUSES)[number];

export const SIGNUP_STATUS_LABEL: Record<SignupStatus, string> = {
  PENDING_APPROVAL: "승인 대기",
  PENDING_DEPOSIT: "입금 대기",
  ACTIVE: "이용 중",
  REJECTED: "반려",
};

export const SIGNUP_TAB_LABEL: Record<SignupStatus, string> = {
  PENDING_APPROVAL: "승인 요청",
  PENDING_DEPOSIT: "입금 확인 대기",
  ACTIVE: "승인 완료",
  REJECTED: "반려",
};

export const REJECT_REASONS = [
  { code: "BUSINESS_MISMATCH", label: "사업자 정보 불일치", template: "제출하신 사업자등록증의 상호와 입력한 회사명이 달라요. 정확한 정보로 다시 신청해 주세요." },
  { code: "DOCUMENT_MISSING", label: "제출 서류 누락 · 식별 불가", template: "제출하신 서류를 확인할 수 없어요. 선명한 사업자등록증을 다시 첨부해 주세요." },
  { code: "DUPLICATE", label: "중복 신청", template: "같은 사업자번호로 이미 이용 중인 회사가 있어요. 기존 계정으로 로그인해 주세요." },
  { code: "OTHER", label: "기타 (직접 입력)", template: "" },
] as const;
export type RejectReasonCode = (typeof REJECT_REASONS)[number]["code"];
export const REJECT_REASON_MAX = 300;

export interface SignupDocument {
  documentId: string;
  name: string;
  contentType?: string;
  size?: number;
  url?: string;
}

export interface SignupRequest {
  requestId: string;
  companyName: string;
  businessNumber?: string;
  managerName?: string;
  managerPhone?: string;
  email?: string;
  requestedAt?: string;
  approvedAt?: string;
  siteCount: number;
  status: SignupStatus;
  documents: SignupDocument[];
  planName?: string;
  monthlyFee?: number;
  depositDueAt?: string;
  depositOverdue: boolean;
}

export interface SignupDetail extends SignupRequest {
  representative?: string;
  industry?: string;
  address?: string;
  managerTeam?: string;
  businessVerified: boolean;
  emailVerified: boolean;
  memo: string;
}

export type SignupCounts = Record<SignupStatus, number> & { newToday: number };

function normalizeDocument(raw: unknown): SignupDocument {
  const r = obj(raw);
  return { documentId: str(r.documentId), name: str(r.name, "제출 서류"), contentType: optStr(r.contentType), size: optCount(r.size), url: optStr(r.url) };
}

export function normalizeSignup(raw: unknown): SignupRequest {
  const r = obj(raw);
  const plan = obj(r.plan);
  return {
    requestId: str(r.requestId),
    companyName: str(r.companyName, "(이름 없음)"),
    businessNumber: optStr(r.businessNumber),
    managerName: optStr(r.managerName),
    managerPhone: optStr(r.managerPhone),
    email: optStr(r.email),
    requestedAt: optStr(r.requestedAt),
    approvedAt: optStr(r.approvedAt),
    siteCount: count(r.siteCount),
    status: oneOf(r.status, SIGNUP_STATUSES, "PENDING_APPROVAL"),
    documents: list(r.documents).map(normalizeDocument),
    planName: optStr(plan.name),
    monthlyFee: optCount(plan.monthlyFee),
    depositDueAt: optStr(r.depositDueAt),
    depositOverdue: r.depositStatus === "OVERDUE",
  };
}

export function normalizeSignupPage(raw: unknown) {
  const r = obj(raw);
  const c = obj(r.counts);
  const counts: SignupCounts = {
    PENDING_APPROVAL: count(c.pendingApproval),
    PENDING_DEPOSIT: count(c.pendingDeposit),
    ACTIVE: count(c.active),
    REJECTED: count(c.rejected),
    newToday: count(c.newToday),
  };
  return { items: list(r.items).map(normalizeSignup).filter((i) => i.requestId), counts, page: pageOf(r) };
}

export function normalizeSignupDetail(raw: unknown): SignupDetail {
  const r = obj(raw);
  return {
    ...normalizeSignup(r),
    representative: optStr(r.representative),
    industry: optStr(r.industry),
    address: optStr(r.address),
    managerTeam: optStr(r.managerTeam),
    businessVerified: r.businessVerified === true,
    emailVerified: r.emailVerified === true,
    memo: str(r.memo),
  };
}

/** 신청 후 지난 시간: "2시간 전" / "1일 경과" / 2일 이상이면 오래 기다린 건으로 표시 */
export function waitingLabel(requestedAt: string | undefined, now = Date.now()): { label: string; overdue: boolean } | null {
  if (!requestedAt) return null;
  const t = Date.parse(requestedAt);
  if (!Number.isFinite(t)) return null;
  const hours = Math.max(0, Math.floor((now - t) / 3_600_000));
  if (hours < 24) return { label: hours < 1 ? "방금 전" : `${hours}시간 전`, overdue: false };
  const days = Math.floor(hours / 24);
  return { label: `${days}일 경과`, overdue: days >= 2 };
}

/** 입금 기한: "D-1", "D-day", 지났으면 "기한 지남" */
export function depositDueLabel(dueAt: string | undefined, now = Date.now()): { label: string; overdue: boolean } | null {
  if (!dueAt) return null;
  const due = Date.parse(dueAt);
  if (!Number.isFinite(due)) return null;
  if (due < now) return { label: "기한 지남", overdue: true };
  const days = Math.floor((due - now) / 86_400_000);
  return { label: days === 0 ? "D-day" : `D-${days}`, overdue: false };
}

export function formatFileSize(bytes: number | undefined): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function formatWon(value: number | undefined): string {
  return value == null ? "" : `${value.toLocaleString("ko-KR")}원`;
}

/* ───────────── 활동 로그 ───────────── */

export const ACTIVITY_TYPES = ["LOGIN", "RECORD_UPLOAD", "SETTINGS_CHANGE", "APPROVAL"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  LOGIN: "로그인",
  RECORD_UPLOAD: "기록 업로드",
  SETTINGS_CHANGE: "설정 변경",
  APPROVAL: "승인 · 반려",
};

export interface ActivityLog {
  logId: string;
  type: ActivityType;
  /** 화면 칩 문구: 로그인 실패·반려처럼 결과까지 담는다 */
  label: string;
  tone: "neutral" | "success" | "warning" | "danger" | "accent";
  companyName?: string;
  actorName?: string;
  message: string;
  ip?: string;
  at?: string;
}

export function normalizeActivity(raw: unknown): ActivityLog {
  const r = obj(raw);
  const type = oneOf(r.type, ACTIVITY_TYPES, "LOGIN");
  const failed = r.result === "FAILURE";
  const rejected = type === "APPROVAL" && r.action === "REJECT";
  const label = type === "LOGIN" && failed ? "로그인 실패" : type === "APPROVAL" ? (rejected ? "반려" : "승인") : ACTIVITY_TYPE_LABEL[type];
  const tone: ActivityLog["tone"] =
    failed || rejected ? "danger" : type === "RECORD_UPLOAD" ? "success" : type === "SETTINGS_CHANGE" ? "warning" : type === "APPROVAL" ? "accent" : "neutral";
  return {
    logId: str(r.logId),
    type,
    label,
    tone,
    companyName: optStr(r.companyName),
    actorName: optStr(r.actorName),
    message: str(r.message),
    ip: optStr(r.ip),
    at: optStr(r.at),
  };
}

export function normalizeActivityPage(raw: unknown) {
  const r = obj(raw);
  return { items: list(r.items).map(normalizeActivity).filter((i) => i.logId), page: pageOf(r) };
}

/** 시간순 로그를 KST 날짜별로 묶는다. 제목: "오늘 · 2026. 7. 27. (월)" */
export function groupByDay(items: ActivityLog[], now = new Date()): { key: string; title: string; items: ActivityLog[] }[] {
  const dayKey = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const groups = new Map<string, ActivityLog[]>();
  for (const item of items) {
    const t = item.at ? new Date(item.at) : null;
    const key = t && !Number.isNaN(t.getTime()) ? dayKey(t) : "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return [...groups.entries()].map(([key, groupItems]) => {
    if (key === "unknown") return { key, title: "날짜 없음", items: groupItems };
    const [y, m, d] = key.split("-").map(Number);
    const weekday = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("ko-KR", { weekday: "short", timeZone: "UTC" });
    const prefix = key === today ? "오늘 · " : key === yesterday ? "어제 · " : "";
    return { key, title: `${prefix}${y}. ${m}. ${d}. (${weekday})`, items: groupItems };
  });
}

/** 로그 시각 "14:52" (KST) */
export function timeOfDay(iso: string | undefined): string {
  if (!iso) return "";
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" });
}

/* ───────────── 알림 (상단 벨) ───────────── */

export interface OpsNotification {
  notificationId: string;
  message: string;
  at?: string;
  /** 누르면 이동할 콘솔 경로 (예: /ops/signups) */
  link?: string;
  read: boolean;
}

export function normalizeNotifications(raw: unknown) {
  const r = obj(raw);
  const items = list(r.items).map((n) => {
    const x = obj(n);
    const link = optStr(x.link);
    return {
      notificationId: str(x.notificationId),
      message: str(x.message),
      at: optStr(x.at),
      // 콘솔 안 경로만 따라간다 (외부 주소로 보내지 않는다)
      link: link && link.startsWith("/ops/") ? link : undefined,
      read: x.read === true,
    };
  }).filter((n) => n.notificationId && n.message);
  return { items, unreadCount: count(r.unreadCount) };
}

/* ───────────── 시스템 설정 ───────────── */

export const DEPOSIT_DUE_OPTIONS = [3, 7, 14] as const;
export const AUTO_REJECT_OPTIONS = [7, 14, 30] as const;

export const NOTIFICATION_KEYS = ["newSignup", "newInquiry", "depositDueSoon", "accountLocked"] as const;
export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];
export const NOTIFICATION_LABEL: Record<NotificationKey, string> = {
  newSignup: "새 가입 신청",
  newInquiry: "새 문의 등록",
  depositDueSoon: "입금 기한 하루 전",
  accountLocked: "로그인 실패로 계정 잠금",
};

export interface OpsSettings {
  version: number;
  signupPolicy: { autoApprove: boolean; depositDueDays: number; autoRejectAfterDays: number };
  notifications: Record<NotificationKey, { enabled: boolean; channels: string[] }>;
}

export function normalizeSettings(raw: unknown): OpsSettings {
  const r = obj(raw);
  const policy = obj(r.signupPolicy);
  const n = obj(r.notifications);
  const days = (v: unknown, fallback: number) => (typeof v === "number" && v > 0 ? Math.floor(v) : fallback);
  return {
    version: typeof r.version === "number" ? r.version : 1,
    signupPolicy: {
      autoApprove: policy.autoApprove === true,
      depositDueDays: days(policy.depositDueDays, 7),
      autoRejectAfterDays: days(policy.autoRejectAfterDays, 14),
    },
    notifications: Object.fromEntries(NOTIFICATION_KEYS.map((k) => {
      const x = obj(n[k]);
      return [k, { enabled: x.enabled === true, channels: list(x.channels).filter((c): c is string => typeof c === "string") }];
    })) as OpsSettings["notifications"],
  };
}

export const CHANNEL_LABEL: Record<string, string> = { EMAIL: "이메일", APP: "앱 알림" };

export interface OpsOperator {
  userId: string;
  name: string;
  email: string;
  role: "OWNER" | "OPERATOR";
  lastLoginAt?: string;
  isMe: boolean;
}

export function normalizeOperators(raw: unknown): OpsOperator[] {
  return list(obj(raw).items).map((o) => {
    const x = obj(o);
    return {
      userId: str(x.userId),
      name: str(x.name, "(이름 없음)"),
      email: str(x.email),
      role: x.role === "OWNER" ? "OWNER" : "OPERATOR",
      lastLoginAt: optStr(x.lastLoginAt),
      isMe: x.isMe === true,
    } as OpsOperator;
  }).filter((o) => o.userId);
}

/* ───────────── 집계: 일별 접속 추이 ───────────── */

export interface DailyAccess {
  /** 기간 내 접속한 서로 다른 관리자 수 */
  uniqueVisitors: number;
  items: { date: string; hq: number; site: number; visitors: number }[];
}

export function normalizeDailyAccess(raw: unknown): DailyAccess {
  const r = obj(raw);
  return {
    uniqueVisitors: count(r.uniqueVisitors),
    items: list(r.items).map((d) => {
      const x = obj(d);
      return { date: str(x.date), hq: count(x.hq), site: count(x.site), visitors: count(x.visitors) };
    }).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date)).sort((a, b) => a.date.localeCompare(b.date)),
  };
}
