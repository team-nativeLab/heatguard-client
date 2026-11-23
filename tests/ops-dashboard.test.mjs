import assert from "node:assert/strict";
import test from "node:test";
import {
  accessShares,
  formatDiff,
  formatNew,
  formatRate,
  normalizeAccess,
  normalizeSummary,
  trendOf,
} from "../src/lib/opsDashboard.ts";

const serverSummary = {
  period: { days: 30, from: "2026-10-24T00:00:00+09:00", to: "2026-11-23T14:00:00+09:00" },
  companies: { total: 24, change: 3 },
  sites: { total: 58, change: 6 },
  records: { total: 12480, change: 1204 },
  signupsToday: { today: 2, yesterday: 0 },
  uploadsToday: { today: 318, yesterday: 284 },
  openInquiries: 2,
  scope: "CURRENT_DATABASE",
  uploadsWithoutUsageTimestamp: 0,
};

test("normalizeSummary reads the server contract", () => {
  const s = normalizeSummary(serverSummary, 30);
  assert.deepEqual(s, {
    days: 30,
    companies: { total: 24, change: 3 },
    sites: { total: 58, change: 6 },
    records: { total: 12480, change: 1204 },
    signupsToday: { today: 2, yesterday: 0 },
    uploadsToday: { today: 318, yesterday: 284 },
    openInquiries: 2,
  });
});

test("normalizeSummary falls back to zero for missing or bad values", () => {
  const s = normalizeSummary({ companies: { total: "24" }, sites: null, records: { total: -1, change: NaN } }, 7);
  assert.equal(s.days, 7);
  assert.deepEqual(s.companies, { total: 0, change: 0 });
  assert.deepEqual(s.sites, { total: 0, change: 0 });
  assert.deepEqual(s.records, { total: 0, change: 0 });
  assert.deepEqual(s.uploadsToday, { today: 0, yesterday: 0 });
  assert.deepEqual(normalizeSummary(null, 30).signupsToday, { today: 0, yesterday: 0 });
});

test("normalizeAccess orders HQ then site and recomputes the total", () => {
  const a = normalizeAccess({
    period: { days: 30 },
    total: 999,
    items: [
      { role: "SITE_MANAGER", label: "현장", count: 694 },
      { role: "HQ_MANAGER", label: "본사", count: 1153 },
    ],
    firstRecordedLoginAt: "2026-11-23T02:00:00+00:00",
  }, 30);
  assert.deepEqual(a.items.map((i) => [i.role, i.count]), [["HQ_MANAGER", 1153], ["SITE_MANAGER", 694]]);
  assert.equal(a.total, 1847);
  assert.equal(a.firstRecordedLoginAt, "2026-11-23T02:00:00+00:00");
});

test("normalizeAccess fills a missing role with zero", () => {
  const a = normalizeAccess({ items: [{ role: "HQ_MANAGER", count: 3 }], firstRecordedLoginAt: null }, 7);
  assert.deepEqual(a.items, [
    { role: "HQ_MANAGER", label: "본사", count: 3 },
    { role: "SITE_MANAGER", label: "현장", count: 0 },
  ]);
  assert.equal(a.firstRecordedLoginAt, null);
  assert.equal(a.days, 7);
});

test("accessShares matches the design and sums to 100", () => {
  const items = [{ count: 1153 }, { count: 694 }];
  assert.deepEqual(accessShares(items), [62.4, 37.6]);
  const thirds = accessShares([{ count: 1 }, { count: 2 }]);
  assert.equal(Math.round((thirds[0] + thirds[1]) * 10) / 10, 100);
});

test("accessShares is zero when nobody logged in", () => {
  assert.deepEqual(accessShares([{ count: 0 }, { count: 0 }]), [0, 0]);
});

test("formatNew shows the new count", () => {
  assert.equal(formatNew(3), "+3");
  assert.equal(formatNew(1204), "+1,204");
  assert.equal(formatNew(0), "0");
});

test("formatDiff and formatRate compare with yesterday", () => {
  assert.equal(formatDiff(2, 0), "+2");
  assert.equal(formatDiff(1, 3), "-2");
  assert.equal(formatDiff(4, 4), "0");
  assert.equal(formatRate(318, 284), "+12%");
  assert.equal(formatRate(250, 284), "-12%");
  assert.equal(formatRate(284, 284), "0%");
  assert.equal(formatRate(5, 0), "+5", "no rate when yesterday is zero");
  assert.equal(formatRate(0, 0), "0");
});

test("trendOf", () => {
  assert.equal(trendOf(2, 1), "up");
  assert.equal(trendOf(1, 2), "down");
  assert.equal(trendOf(1, 1), "flat");
});
