import assert from "node:assert/strict";
import test from "node:test";
import {
  depositDueLabel,
  formatFileSize,
  groupByDay,
  normalizeActivity,
  normalizeCompanyPage,
  normalizeDailyAccess,
  normalizeNotifications,
  normalizeSettings,
  normalizeSignupPage,
  timeOfDay,
  waitingLabel,
} from "../src/lib/opsAdmin.ts";
import { toCsv } from "../src/lib/csv.ts";

test("normalizeCompanyPage reads items, counts and cursor", () => {
  const res = normalizeCompanyPage({
    items: [{ companyId: "c1", name: "한빛종합건설", siteCount: 6, recordCount: 1284, status: "ACTIVE" }, { name: "id 없음" }],
    counts: { all: 24, active: 21, suspended: 2, withdrawn: 1 },
    page: { nextCursor: "n1" },
  });
  assert.equal(res.items.length, 1, "items without an id are dropped");
  assert.deepEqual(res.counts, { all: 24, active: 21, suspended: 2, withdrawn: 1 });
  assert.equal(res.page.nextCursor, "n1");
});

test("unknown company status falls back to ACTIVE", () => {
  assert.equal(normalizeCompanyPage({ items: [{ companyId: "c", status: "WEIRD" }] }).items[0].status, "ACTIVE");
});

test("normalizeSignupPage maps counts and deposit fields", () => {
  const res = normalizeSignupPage({
    items: [{ requestId: "r1", companyName: "미래플랜트", status: "PENDING_DEPOSIT", plan: { name: "기본", monthlyFee: 99000 }, depositStatus: "OVERDUE", documents: [{ documentId: "d", name: "사업자등록증.pdf", size: 1200000 }] }],
    counts: { pendingApproval: 3, pendingDeposit: 2, active: 12, rejected: 2, newToday: 3 },
  });
  const r = res.items[0];
  assert.equal(r.planName, "기본");
  assert.equal(r.monthlyFee, 99000);
  assert.equal(r.depositOverdue, true);
  assert.equal(r.documents[0].name, "사업자등록증.pdf");
  assert.equal(res.counts.PENDING_APPROVAL, 3);
  assert.equal(res.counts.newToday, 3);
});

test("waitingLabel flags requests waiting two days or more", () => {
  const now = Date.parse("2026-07-27T16:00:00+09:00");
  assert.deepEqual(waitingLabel("2026-07-27T14:00:00+09:00", now), { label: "2시간 전", overdue: false });
  assert.deepEqual(waitingLabel("2026-07-26T10:00:00+09:00", now), { label: "1일 경과", overdue: false });
  assert.deepEqual(waitingLabel("2026-07-25T10:00:00+09:00", now), { label: "2일 경과", overdue: true });
  assert.equal(waitingLabel(undefined, now), null);
});

test("depositDueLabel counts down and reports overdue", () => {
  const now = Date.parse("2026-07-27T12:00:00+09:00");
  assert.deepEqual(depositDueLabel("2026-07-28T18:00:00+09:00", now), { label: "D-1", overdue: false });
  assert.deepEqual(depositDueLabel("2026-07-27T20:00:00+09:00", now), { label: "D-day", overdue: false });
  assert.deepEqual(depositDueLabel("2026-07-26T00:00:00+09:00", now), { label: "기한 지남", overdue: true });
});

test("formatFileSize", () => {
  assert.equal(formatFileSize(320 * 1024), "320KB");
  assert.equal(formatFileSize(1.2 * 1024 * 1024), "1.2MB");
  assert.equal(formatFileSize(undefined), "");
});

test("normalizeActivity labels failures and rejections", () => {
  assert.deepEqual([normalizeActivity({ logId: "1", type: "LOGIN", result: "FAILURE" })].map((a) => [a.label, a.tone]), [["로그인 실패", "danger"]]);
  assert.equal(normalizeActivity({ logId: "2", type: "APPROVAL", action: "REJECT" }).label, "반려");
  assert.equal(normalizeActivity({ logId: "3", type: "APPROVAL", action: "APPROVE" }).label, "승인");
  assert.equal(normalizeActivity({ logId: "4", type: "RECORD_UPLOAD" }).tone, "success");
});

test("groupByDay groups by KST date with today/yesterday titles", () => {
  const now = new Date("2026-07-27T15:00:00+09:00");
  const groups = groupByDay([
    normalizeActivity({ logId: "a", at: "2026-07-27T14:52:00+09:00" }),
    normalizeActivity({ logId: "b", at: "2026-07-27T00:10:00+09:00" }),
    normalizeActivity({ logId: "c", at: "2026-07-26T18:30:00+09:00" }),
    normalizeActivity({ logId: "d", at: "2026-07-20T09:00:00+09:00" }),
  ], now);
  assert.deepEqual(groups.map((g) => [g.title, g.items.length]), [
    ["오늘 · 2026. 7. 27. (월)", 2],
    ["어제 · 2026. 7. 26. (일)", 1],
    ["2026. 7. 20. (월)", 1],
  ]);
  assert.equal(timeOfDay("2026-07-27T14:52:00+09:00"), "14:52");
});

test("normalizeNotifications keeps only console links", () => {
  const res = normalizeNotifications({ items: [
    { notificationId: "1", message: "새 가입 신청", link: "/ops/signups" },
    { notificationId: "2", message: "외부", link: "https://evil.example" },
  ], unreadCount: 2 });
  assert.equal(res.items[0].link, "/ops/signups");
  assert.equal(res.items[1].link, undefined);
  assert.equal(res.unreadCount, 2);
});

test("normalizeSettings fills defaults", () => {
  const s = normalizeSettings({ signupPolicy: { autoApprove: true }, notifications: { newInquiry: { enabled: true, channels: ["EMAIL"] } } });
  assert.deepEqual(s.signupPolicy, { autoApprove: true, depositDueDays: 7, autoRejectAfterDays: 14 });
  assert.equal(s.notifications.newInquiry.enabled, true);
  assert.equal(s.notifications.newSignup.enabled, false);
});

test("normalizeDailyAccess sorts by date and drops bad rows", () => {
  const d = normalizeDailyAccess({ uniqueVisitors: 9, items: [{ date: "2026-07-22", visitors: 2 }, { date: "bad" }, { date: "2026-07-21", visitors: 1 }] });
  assert.deepEqual(d.items.map((i) => i.date), ["2026-07-21", "2026-07-22"]);
  assert.equal(d.uniqueVisitors, 9);
});

test("toCsv escapes quotes, commas and formula-like cells", () => {
  const csv = toCsv(["a", "b"], [["x,y", '"q"'], ["=SUM(A1)", 3]]);
  assert.equal(csv, '\uFEFFa,b\r\n"x,y","""q"""\r\n\'=SUM(A1),3');
});
