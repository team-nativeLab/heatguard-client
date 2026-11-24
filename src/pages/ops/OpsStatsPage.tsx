import { useCallback, useState } from "react";
import OpsLayout, { OpsPageHeader } from "../../components/ops/OpsLayout";
import OpsIcon from "../../components/ops/OpsIcon";
import { AccessDonut, KpiCard, Panel } from "../../components/ops/OpsWidgets";
import { CARD, DONUT_COLORS } from "../../components/ops/opsStyles";
import { errorMessage, opsApi, type DashboardAccess, type DashboardDays } from "../../api";
import { usePolling } from "../../shared/hooks/usePolling";
import { formatDateTime } from "../../lib/opsInquiry";
import { DASHBOARD_PERIODS, DEFAULT_DASHBOARD_DAYS, accessShares, formatCount } from "../../lib/opsDashboard";

/*
 * 집계 페이지 (Figma 02_집계 페이지, node 2956:1202).
 * 서버 집계(GET /api/v1/ops/dashboard/access)는 본사·현장 관리자의 "성공 로그인 횟수"를
 * 최근 7·30·90일 단위로만 준다. 그래서 Figma의 방문자 수·방문자 추이(일별)·오늘/어제/누계 탭은
 * 데이터가 없어 넣지 않고, 기간은 서버가 주는 7·30·90일로 바꿨다.
 */

const REFRESH_MS = 60_000;

type AccessByDays = Partial<Record<DashboardDays, DashboardAccess | null>>;

export default function OpsStatsPage() {
  const [days, setDays] = useState<DashboardDays>(DEFAULT_DASHBOARD_DAYS);
  const [byDays, setByDays] = useState<AccessByDays | null>(null);
  const [error, setError] = useState("");

  // 사이트 현황 표가 기간별 열을 함께 보여주므로 세 기간을 한 번에 받는다.
  const load = useCallback(async () => {
    try {
      const results = await Promise.all(DASHBOARD_PERIODS.map((d) => opsApi.getDashboardAccess(d)));
      setByDays(Object.fromEntries(DASHBOARD_PERIODS.map((d, i) => [d, results[i]])) as AccessByDays);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "집계를 불러오지 못했어요."));
    }
  }, []);

  usePolling(load, REFRESH_MS, null);

  const current = byDays?.[days];
  const unsupported = byDays !== null && current === null;
  const hq = current?.items.find((i) => i.role === "HQ_MANAGER");
  const site = current?.items.find((i) => i.role === "SITE_MANAGER");

  const periodTabs = (
    <div role="tablist" aria-label="집계 기간" className="inline-flex gap-1 self-start rounded-full border border-[var(--ops-border)] bg-[var(--ops-surface)] p-1">
      {DASHBOARD_PERIODS.map((d) => (
        <button
          key={d}
          type="button"
          role="tab"
          aria-selected={days === d}
          onClick={() => setDays(d)}
          className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
            days === d ? "bg-[var(--ops-accent)] font-bold text-white" : "font-medium text-[var(--ops-body)] hover:bg-[var(--ops-chip-bg)]"
          }`}
        >
          최근 {d}일
        </button>
      ))}
    </div>
  );

  return (
    <OpsLayout>
      <div className="flex w-full flex-col gap-4 px-4 pb-8 md:px-8">
        <div className="mb-2">
          <OpsPageHeader crumb="운영 통계 › 집계 페이지" title="집계 페이지" description="관리자 사이트 접속 현황을 기간별로 확인합니다." />
        </div>

        {error && !byDays ? (
          <div className={`${CARD} flex flex-col items-center gap-3 p-10`}>
            <p role="alert" className="text-sm text-[var(--color-danger-text)]">{error}</p>
            <button type="button" onClick={() => void load()} className="rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] px-4 py-2 text-[13px] font-medium text-[var(--ops-body)]">다시 시도</button>
          </div>
        ) : unsupported ? (
          <div className={`${CARD} flex min-h-[240px] items-center justify-center p-10`}>
            <p className="text-center text-sm text-[var(--ops-faint)]">서버에 집계 기능이 아직 배포되지 않았어요.</p>
          </div>
        ) : (
          <>
            {periodTabs}
            {error && <p role="alert" className={`${CARD} px-4 py-3 text-sm text-[var(--color-danger-text)]`}>{error}</p>}

            <section aria-label="접속 지표" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard label="본사 관리자 접속" value={hq?.count} icon="building" />
              <KpiCard label="현장 관리자 접속" value={site?.count} icon="user" />
              <KpiCard label="전체 접속 수" value={current?.total} icon="chart" />
            </section>

            <Panel icon="pie" title="사이트 접속 비중" className="min-h-[280px]"
              action={<span className="text-xs text-[var(--ops-faint)]">최근 {days}일 · 관리자 로그인</span>}>
              {current ? (
                <AccessDonut access={current} />
              ) : (
                <p role="status" className="m-auto py-6 text-center text-sm text-[var(--ops-faint)]">불러오는 중...</p>
              )}
            </Panel>

            <section aria-label="사이트 현황" className={`${CARD} flex min-w-0 flex-col overflow-hidden`}>
              <h2 className="flex items-center gap-2 p-[19px] text-[15px] font-bold text-[var(--ops-heading)]">
                <OpsIcon name="chart" size={18} />
                사이트 현황
              </h2>
              {!byDays ? (
                <p role="status" className="m-auto py-10 text-center text-sm text-[var(--ops-faint)]">불러오는 중...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-[var(--ops-bg)] text-xs text-[var(--ops-faint)]">
                      <tr>
                        <th scope="col" className="px-[19px] py-2.5 text-left font-medium">사이트</th>
                        {DASHBOARD_PERIODS.map((d) => (
                          <th key={d} scope="col" className="px-3 py-2.5 text-right font-medium">최근 {d}일</th>
                        ))}
                        <th scope="col" className="px-[19px] py-2.5 text-left font-medium">접속 비중 (최근 {days}일)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ops-divider)]">
                      {(["HQ_MANAGER", "SITE_MANAGER"] as const).map((role, row) => {
                        const label = current?.items.find((i) => i.role === role)?.label ?? (role === "HQ_MANAGER" ? "본사" : "현장");
                        const share = current ? accessShares(current.items)[current.items.findIndex((i) => i.role === role)] ?? 0 : 0;
                        return (
                          <tr key={role}>
                            <td className="px-[19px] py-3">
                              <span className="flex items-center gap-2.5 font-medium text-[var(--ops-heading)]">
                                <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--ops-accent-soft)] text-[var(--ops-accent)]">
                                  <OpsIcon name={role === "HQ_MANAGER" ? "building" : "user"} size={14} />
                                </span>
                                폭염가드 ({label})
                              </span>
                            </td>
                            {DASHBOARD_PERIODS.map((d) => {
                              const count = byDays[d]?.items.find((i) => i.role === role)?.count;
                              return (
                                <td key={d} className={`font-mono-num px-3 py-3 text-right ${d === days ? "font-bold text-[var(--ops-heading)]" : "text-[var(--ops-body)]"}`}>
                                  {count == null ? "–" : `${formatCount(count)}회`}
                                </td>
                              );
                            })}
                            <td className="px-[19px] py-3">
                              <span className="flex items-center gap-3">
                                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--ops-chip-bg)]">
                                  <span className="block h-full rounded-full" style={{ width: `${share}%`, background: DONUT_COLORS[row] }} />
                                </span>
                                <span className="font-mono-num w-12 text-right text-[var(--ops-body)]">{share.toFixed(1)}%</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="border-t border-[var(--ops-divider)] px-[19px] py-3 text-xs text-[var(--ops-faint)]">
                접속 수는 본사·현장 관리자의 로그인 성공 횟수예요.
                {current?.firstRecordedLoginAt && ` ${formatDateTime(current.firstRecordedLoginAt, false)}부터 기록된 로그인만 집계돼요.`}
              </p>
            </section>
          </>
        )}
      </div>
    </OpsLayout>
  );
}
