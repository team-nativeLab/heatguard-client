/*
 * 운영자 대시보드 지표 (GET /api/v1/ops/dashboard/summary, /access).
 * 서버 계약: heatguard-server docs/ops-dashboard.md
 * - change는 직전 기간 대비 증감이 아니라 "기간 내 신규 수"다.
 * - 접속은 방문자 수가 아니라 본사·현장 관리자의 성공 로그인 횟수다.
 * - 집계 범위는 현재 DB(scope=CURRENT_DATABASE)다.
 */

export const DASHBOARD_PERIODS = [7, 30, 90] as const;
export type DashboardDays = (typeof DASHBOARD_PERIODS)[number];
export const DEFAULT_DASHBOARD_DAYS: DashboardDays = 30;

export interface CountWithChange {
  total: number;
  change: number;
}

export interface TodayCount {
  today: number;
  yesterday: number;
}

export interface DashboardSummary {
  days: number;
  companies: CountWithChange;
  sites: CountWithChange;
  records: CountWithChange;
  signupsToday: TodayCount;
  uploadsToday: TodayCount;
  openInquiries: number;
}

export type AccessRole = "HQ_MANAGER" | "SITE_MANAGER";

export interface AccessItem {
  role: AccessRole;
  label: string;
  count: number;
}

export interface DashboardAccess {
  days: number;
  total: number;
  items: AccessItem[];
  firstRecordedLoginAt: string | null;
}

type Raw = Record<string, unknown>;

const obj = (value: unknown): Raw => (value && typeof value === "object" ? (value as Raw) : {});
const count = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

const withChange = (value: unknown): CountWithChange => {
  const r = obj(value);
  return { total: count(r.total), change: count(r.change) };
};

const todayCount = (value: unknown): TodayCount => {
  const r = obj(value);
  return { today: count(r.today), yesterday: count(r.yesterday) };
};

const periodDays = (value: unknown, fallback: number) => {
  const days = obj(value).days;
  return typeof days === "number" && Number.isFinite(days) ? days : fallback;
};

export function normalizeSummary(raw: unknown, requestedDays: number): DashboardSummary {
  const r = obj(raw);
  return {
    days: periodDays(r.period, requestedDays),
    companies: withChange(r.companies),
    sites: withChange(r.sites),
    records: withChange(r.records),
    signupsToday: todayCount(r.signupsToday),
    uploadsToday: todayCount(r.uploadsToday),
    openInquiries: count(r.openInquiries),
  };
}

const ROLE_LABEL: Record<AccessRole, string> = { HQ_MANAGER: "본사", SITE_MANAGER: "현장" };

/** 서버는 본사·현장 두 원소를 항상 주지만, 빠지거나 순서가 달라도 본사 → 현장으로 맞춘다. */
export function normalizeAccess(raw: unknown, requestedDays: number): DashboardAccess {
  const r = obj(raw);
  const list = Array.isArray(r.items) ? r.items.map(obj) : [];
  const items = (Object.keys(ROLE_LABEL) as AccessRole[]).map((role) => {
    const found = list.find((i) => i.role === role);
    const label = typeof found?.label === "string" && found.label ? found.label : ROLE_LABEL[role];
    return { role, label, count: count(found?.count) };
  });
  const first = r.firstRecordedLoginAt;
  return {
    days: periodDays(r.period, requestedDays),
    total: items.reduce((sum, i) => sum + i.count, 0),
    items,
    firstRecordedLoginAt: typeof first === "string" && first ? first : null,
  };
}

/** 소수 첫째 자리 비율. 반올림 뒤에도 합이 100.0이 되도록 나머지는 마지막 항목에 몰아준다. */
export function accessShares(items: AccessItem[]): number[] {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  if (total === 0) return items.map(() => 0);
  const shares = items.map((i) => Math.round((i.count / total) * 1000) / 10);
  const rest = shares.slice(0, -1).reduce((sum, s) => sum + s, 0);
  shares[shares.length - 1] = Math.round((100 - rest) * 10) / 10;
  return shares;
}

export function formatCount(value: number): string {
  return value.toLocaleString("ko-KR");
}

/** "+3" / "0". change는 신규 수라 음수가 없다. */
export function formatNew(change: number): string {
  return change > 0 ? `+${formatCount(change)}` : "0";
}

/** 가입처럼 적은 수는 건수 차이로: "+2", "-1", "0" */
export function formatDiff(today: number, yesterday: number): string {
  const diff = today - yesterday;
  if (diff === 0) return "0";
  return `${diff > 0 ? "+" : "-"}${formatCount(Math.abs(diff))}`;
}

/**
 * 업로드처럼 큰 수는 비율로: "+12%". 어제가 0이면 비율을 낼 수 없어 건수 차이로 보여준다.
 */
export function formatRate(today: number, yesterday: number): string {
  if (yesterday === 0) return formatDiff(today, yesterday);
  const rate = Math.round(((today - yesterday) / yesterday) * 100);
  if (rate === 0) return "0%";
  return `${rate > 0 ? "+" : ""}${rate}%`;
}

export function trendOf(today: number, yesterday: number): "up" | "down" | "flat" {
  if (today > yesterday) return "up";
  if (today < yesterday) return "down";
  return "flat";
}
