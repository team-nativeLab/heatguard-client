import { ApiError, apiFetch } from "./client";
import {
  normalizeActivityPage,
  normalizeCompanyDetail,
  normalizeDailyAccess,
  normalizeCompanyPage,
  normalizeNotifications,
  normalizeOperators,
  normalizeSettings,
  type OpsSettings,
  normalizeSignupDetail,
  normalizeSignupPage,
  type ActivityType,
  type CompanyStatus,
  type RejectReasonCode,
  type SignupStatus,
} from "../lib/opsAdmin";

/*
 * 운영자 콘솔: 회원 관리·가입 승인·활동 로그 API.
 * 아직 서버에 없는 API다(요청서: docs/ops-console-api-request.md).
 * 조회는 서버에 경로가 없으면(404/405) null을 돌려주고, 화면은 "서버 준비 중"을 보여준다.
 */

/**
 * 목록 API가 서버에 없으면(404/405) null. 서버는 "경로 없음"과 "항목 없음"을 같은 404 코드로 주므로,
 * 기능 유무는 목록 조회로만 판단하고 상세·변경 요청의 404는 일반 오류로 다룬다.
 */
async function optional<T>(request: () => Promise<T>): Promise<T | null> {
  try {
    return await request();
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) return null;
    throw err;
  }
}

const enc = encodeURIComponent;

/* ───────────── 회원 관리 ───────────── */

export function listCompanies(params: { status?: CompanyStatus; q?: string; joined?: string; sort?: string; cursor?: string }) {
  return optional(async () =>
    normalizeCompanyPage(await apiFetch<unknown>("/api/v1/ops/companies", { params: { ...params, limit: 20 } })),
  );
}

export async function getCompany(companyId: string) {
  return normalizeCompanyDetail(await apiFetch<unknown>(`/api/v1/ops/companies/${enc(companyId)}`));
}

export function suspendCompany(companyId: string, reason: string) {
  return apiFetch<unknown>(`/api/v1/ops/companies/${enc(companyId)}/suspend`, { method: "POST", body: { reason } });
}

export function resumeCompany(companyId: string) {
  return apiFetch<unknown>(`/api/v1/ops/companies/${enc(companyId)}/resume`, { method: "POST" });
}

/* ───────────── 가입 승인 ───────────── */

/** status를 빼면 전체 상태를 최근 순으로 준다 (대시보드 "최근 가입 신청") */
export function listSignupRequests(params: { status?: SignupStatus; q?: string; requested?: string; document?: string; sort?: string; cursor?: string; limit?: number }) {
  return optional(async () =>
    normalizeSignupPage(await apiFetch<unknown>("/api/v1/ops/signup-requests", { params: { limit: 20, ...params } })),
  );
}

export async function getSignupRequest(requestId: string) {
  return normalizeSignupDetail(await apiFetch<unknown>(`/api/v1/ops/signup-requests/${enc(requestId)}`));
}

export function approveSignup(requestId: string, memo?: string) {
  return apiFetch<unknown>(`/api/v1/ops/signup-requests/${enc(requestId)}/approve`, { method: "POST", body: { memo: memo || undefined } });
}

export function rejectSignup(requestId: string, payload: { reasonCode: RejectReasonCode; reason: string; allowReapply: boolean }) {
  return apiFetch<unknown>(`/api/v1/ops/signup-requests/${enc(requestId)}/reject`, { method: "POST", body: payload });
}

export function confirmDeposit(requestId: string) {
  return apiFetch<unknown>(`/api/v1/ops/signup-requests/${enc(requestId)}/confirm-deposit`, { method: "POST" });
}

export function undoDepositConfirmation(requestId: string) {
  return apiFetch<unknown>(`/api/v1/ops/signup-requests/${enc(requestId)}/confirm-deposit`, { method: "DELETE" });
}

export function sendDepositReminder(requestId: string) {
  return apiFetch<unknown>(`/api/v1/ops/signup-requests/${enc(requestId)}/deposit-reminder`, { method: "POST" });
}

export function saveSignupMemo(requestId: string, memo: string) {
  return apiFetch<unknown>(`/api/v1/ops/signup-requests/${enc(requestId)}/memo`, { method: "PUT", body: { memo } });
}

/* ───────────── 활동 로그 ───────────── */

export function listActivityLogs(params: { type?: ActivityType; days: number; companyId?: string; cursor?: string }) {
  return optional(async () =>
    normalizeActivityPage(await apiFetch<unknown>("/api/v1/ops/activity-logs", { params: { ...params, limit: 50 } })),
  );
}

/* ───────────── 알림 ───────────── */

export function listNotifications() {
  return optional(async () => normalizeNotifications(await apiFetch<unknown>("/api/v1/ops/notifications", { params: { limit: 20 } })));
}

export function markNotificationsRead() {
  return apiFetch<unknown>("/api/v1/ops/notifications/read", { method: "POST" });
}

/* ───────────── 시스템 설정 ───────────── */

export function getSettings() {
  return optional(async () => normalizeSettings(await apiFetch<unknown>("/api/v1/ops/settings")));
}

/** version이 다르면 409 (다른 운영자가 먼저 바꿈) */
export async function updateSettings(settings: OpsSettings) {
  return normalizeSettings(await apiFetch<unknown>("/api/v1/ops/settings", { method: "PUT", body: settings }));
}

export function listOperators() {
  return optional(async () => normalizeOperators(await apiFetch<unknown>("/api/v1/ops/operators")));
}

export function inviteOperator(payload: { name: string; email: string }) {
  return apiFetch<unknown>("/api/v1/ops/operators/invitations", { method: "POST", body: payload });
}

/* ───────────── 집계: 일별 추이 ───────────── */

export function getDailyAccess(days: number) {
  return optional(async () => normalizeDailyAccess(await apiFetch<unknown>("/api/v1/ops/dashboard/access/daily", { params: { days } })));
}
