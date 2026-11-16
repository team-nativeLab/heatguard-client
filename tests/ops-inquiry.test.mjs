import assert from "node:assert/strict";
import test from "node:test";
import {
  REPLY_MAX_LENGTH,
  formatDateTime,
  inquiryType,
  matchesTab,
  mayHaveBeenSaved,
  relativeTime,
  replyLanded,
} from "../src/lib/opsInquiry.ts";

test("inquiryType reads the bracket prefix", () => {
  assert.equal(inquiryType("[기능 문의] 업로드 오류 관련 문의"), "기능 문의");
  assert.equal(inquiryType("  [요금 문의] 세금계산서"), "요금 문의");
});

test("inquiryType falls back to 기타 without a prefix", () => {
  assert.equal(inquiryType("업로드가 안 돼요"), "기타");
  assert.equal(inquiryType(""), "기타");
  assert.equal(inquiryType("[]빈 괄호"), "기타");
});

test("inquiryType ignores an unreasonably long bracket", () => {
  assert.equal(inquiryType(`[${"가".repeat(30)}] 제목`), "기타");
});

test("matchesTab splits OPEN from answered and closed", () => {
  assert.equal(matchesTab("OPEN", "open"), true);
  assert.equal(matchesTab("ANSWERED", "open"), false);
  assert.equal(matchesTab("ANSWERED", "done"), true);
  assert.equal(matchesTab("CLOSED", "done"), true);
  assert.equal(matchesTab("OPEN", "done"), false);
  for (const status of ["OPEN", "ANSWERED", "CLOSED"]) assert.equal(matchesTab(status, "all"), true);
});

test("relativeTime formats recent times", () => {
  const now = Date.parse("2026-11-16T12:00:00+09:00");
  assert.equal(relativeTime("2026-11-16T11:59:40+09:00", now), "방금 전");
  assert.equal(relativeTime("2026-11-16T11:30:00+09:00", now), "30분 전");
  assert.equal(relativeTime("2026-11-16T10:00:00+09:00", now), "2시간 전");
  assert.equal(relativeTime("2026-11-13T12:00:00+09:00", now), "3일 전");
});

test("relativeTime switches to a date after a week", () => {
  const now = Date.parse("2026-11-16T12:00:00+09:00");
  assert.match(relativeTime("2026-11-01T12:00:00+09:00", now), /^2026\. 11\. \d+\.$/);
});

test("relativeTime and formatDateTime tolerate missing or bad input", () => {
  assert.equal(relativeTime(undefined), "");
  assert.equal(relativeTime("not-a-date"), "");
  assert.equal(formatDateTime(undefined), "");
  assert.equal(formatDateTime("not-a-date"), "");
});

test("reply limit matches the design", () => {
  assert.equal(REPLY_MAX_LENGTH, 1000);
});

test("network errors and 5xx may have saved the reply", () => {
  assert.equal(mayHaveBeenSaved({ network: true }), true);
  assert.equal(mayHaveBeenSaved({ status: 503 }), true);
  assert.equal(mayHaveBeenSaved({ status: 500 }), true);
});

test("4xx rejections did not save the reply", () => {
  for (const status of [400, 401, 403, 404, 409, 429]) {
    assert.equal(mayHaveBeenSaved({ status }), false, `status ${status}`);
  }
  assert.equal(mayHaveBeenSaved({}), false);
});

test("replyLanded detects a reply saved despite the error", () => {
  assert.equal(replyLanded(0, 1), true);
  assert.equal(replyLanded(2, 3), true);
  assert.equal(replyLanded(1, 1), false);
  assert.equal(replyLanded(1, 0), false);
});
