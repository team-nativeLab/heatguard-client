import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import OpsLayout, { OpsPageHeader } from "../../components/ops/OpsLayout";
import OpsIcon, { type OpsIconName } from "../../components/ops/OpsIcon";
import { errorMessage, opsApi, type DashboardAccess, type DashboardDays, type DashboardSummary, type OpsInquiry } from "../../api";
import { usePolling } from "../../shared/hooks/usePolling";
import { STATUS_LABEL, formatDateTime, summarizeInquiries } from "../../lib/opsInquiry";
import {
  DASHBOARD_PERIODS,
  DEFAULT_DASHBOARD_DAYS,
  accessShares,
  formatCount,
  formatDiff,
  formatNew,
  formatRate,
  trendOf,
} from "../../lib/opsDashboard";

/*
 * 운영 현황 대시보드 (Figma 01_대시보드 (운영 현황), node 2956:969).
 * - 운영 지표·접속 비중: GET /api/v1/ops/dashboard/summary, /access (현재 DB 기준)
 * - 문의 지표·최근 문의: 문의 목록
 * 대시보드 API가 없는 서버에서는 문의 지표만 보여준다.
 * 최근 가입 신청·가입 승인/입금 대기는 서버 기능이 없어 넣지 않았다.
 */

const REFRESH_MS = 60_000;

/** 아직 불러오는 중이면 undefined, 서버에 API가 없으면 null */
type Loaded<T> = T | null | undefined;

const CARD = "rounded-[14px] border border-[var(--ops-border)] bg-[var(--ops-surface)] shadow-[var(--ops-card-shadow)]";

interface Delta {
  value: string;
  caption: string;
  trend: "up" | "down" | "flat";
}

function KpiCard({ label, value, icon, delta, chip }: {
  label: string;
  value: number | null | undefined;
  icon: OpsIconName;
  delta?: Delta;
  chip?: string;
}) {
  const tone = delta?.trend === "up"
    ? "text-[var(--ops-success-fg)]"
    : delta?.trend === "down"
      ? "text-[var(--color-danger-text)]"
      : "text-[var(--ops-faint)]";
  const arrow = delta?.trend === "up" ? "▲ " : delta?.trend === "down" ? "▼ " : "";
  return (
    <div className={`${CARD} flex h-[120px] min-w-0 flex-col p-[15px]`}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-[var(--ops-accent-soft)] text-[var(--ops-accent)]">
          <OpsIcon name={icon} />
        </span>
        <span className="truncate whitespace-nowrap text-[13px] font-medium text-[var(--ops-body)]" title={label}>{label}</span>
      </div>
      <span className="font-mono-num mt-auto text-2xl font-bold leading-[1.4] text-[var(--ops-heading)]">
        {value == null ? "–" : formatCount(value)}
      </span>
      <div className="mt-1 flex h-[21px] min-w-0 items-center gap-1.5 text-xs">
        {chip ? (
          <span className="rounded-full bg-[var(--ops-warning-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--ops-warning-fg)]">{chip}</span>
        ) : delta ? (
          <>
            <span className={`font-mono-num shrink-0 font-medium ${tone}`}>{arrow}{delta.value}</span>
            <span className="truncate text-[var(--ops-faint)]">{delta.caption}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: OpsInquiry["status"] }) {
  const tone = status === "OPEN"
    ? "bg-[var(--ops-warning-bg)] text-[var(--ops-warning-fg)]"
    : "bg-[var(--ops-chip-bg)] text-[var(--ops-body)]";
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{STATUS_LABEL[status]}</span>;
}

function Panel({ icon, title, action, children, className = "" }: {
  icon: OpsIconName;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-label={title} className={`${CARD} flex min-w-0 flex-col p-[19px] ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-[var(--ops-heading)]">
          <OpsIcon name={icon} size={18} className="text-[var(--ops-heading)]" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ViewAll({ to }: { to: string }) {
  return (
    <Link to={to} className="flex items-center gap-1 text-[13px] font-medium text-[var(--ops-body)] hover:text-[var(--ops-heading)]">
      전체 보기 <OpsIcon name="chevRight" size={14} />
    </Link>
  );
}

const DONUT_SIZE = 164;
const DONUT_STROKE = 24;
const DONUT_COLORS = ["var(--ops-accent)", "var(--ops-donut-site)"];

function AccessDonut({ access }: { access: DashboardAccess }) {
  const shares = accessShares(access.items);
  const r = (DONUT_SIZE - DONUT_STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-1 flex-wrap items-center justify-around gap-6 pt-4">
      <div className="relative" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
        <svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`} className="-rotate-90" aria-hidden>
          <circle cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={r} fill="none" stroke="var(--ops-chip-bg)" strokeWidth={DONUT_STROKE} />
          {access.total > 0 && access.items.map((item, i) => {
            const length = (shares[i] / 100) * circumference;
            const segment = (
              <circle
                key={item.role}
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={r}
                fill="none"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth={DONUT_STROKE}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return segment;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-[var(--ops-faint)]">전체 접속</span>
          <span className="font-mono-num text-[22px] font-bold text-[var(--ops-heading)]">{formatCount(access.total)}회</span>
        </div>
      </div>
      <ul className="flex min-w-[220px] flex-col gap-6">
        {access.items.map((item, i) => (
          <li key={item.role} className="flex items-start gap-2">
            <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} aria-hidden />
            <span className="flex-1 text-sm font-medium text-[var(--ops-body)]">폭염가드 ({item.label})</span>
            <span className="flex flex-col items-end">
              <span className="font-mono-num text-base font-bold text-[var(--ops-heading)]">{shares[i].toFixed(1)}%</span>
              <span className="font-mono-num text-xs text-[var(--ops-faint)]">{formatCount(item.count)}회</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OpsDashboardPage() {
  const [days, setDays] = useState<DashboardDays>(DEFAULT_DASHBOARD_DAYS);
  const [items, setItems] = useState<OpsInquiry[] | null>(null);
  const [summary, setSummary] = useState<Loaded<DashboardSummary>>(undefined);
  const [access, setAccess] = useState<Loaded<DashboardAccess>>(undefined);
  const [error, setError] = useState("");
  const [metricsError, setMetricsError] = useState("");
  // 기간을 바꾼 직후 이전 기간 응답이 늦게 도착해도 덮어쓰지 않는다.
  const requestSeq = useRef(0);

  const load = useCallback(async (period: DashboardDays) => {
    const seq = ++requestSeq.current;
    const [inquiries, summaryRes, accessRes] = await Promise.allSettled([
      opsApi.listInquiries(),
      opsApi.getDashboardSummary(period),
      opsApi.getDashboardAccess(period),
    ]);
    if (seq !== requestSeq.current) return;

    if (inquiries.status === "fulfilled") {
      setItems(inquiries.value.items);
      setError("");
    } else {
      setError(errorMessage(inquiries.reason, "운영 현황을 불러오지 못했어요."));
    }

    // 실패한 지표는 이전 값을 지우지 않고 안내만 띄운다.
    if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
    if (accessRes.status === "fulfilled") setAccess(accessRes.value);
    const failed = [summaryRes, accessRes].find((r) => r.status === "rejected");
    setMetricsError(failed ? errorMessage(failed.reason, "운영 지표를 불러오지 못했어요.") : "");
  }, []);

  // 주기 갱신은 마지막으로 고른 기간을 쓴다. 바꿀 때만 갱신하므로 렌더 중에는 건드리지 않는다.
  const daysRef = useRef(days);
  // 탭이 가려져 있으면 갱신을 멈추고, 다시 보이면 바로 갱신한다.
  usePolling(() => load(daysRef.current), REFRESH_MS, null);

  const changeDays = (next: DashboardDays) => {
    daysRef.current = next;
    setDays(next);
    setSummary((prev) => (prev === null ? null : undefined));
    setAccess((prev) => (prev === null ? null : undefined));
    void load(next);
  };

  const inquirySummary = useMemo(() => (items ? summarizeInquiries(items, 4) : null), [items]);
  const openCount = inquirySummary?.open ?? (summary ? summary.openInquiries : null);
  const metricsAvailable = summary !== null;
  const newCaption = `최근 ${days}일 신규`;
  const growth = (change: number): Delta => ({ value: formatNew(change), caption: newCaption, trend: change > 0 ? "up" : "flat" });

  const periodSelect = metricsAvailable ? (
    <label className="relative inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] px-3.5 text-[13px] font-medium text-[var(--ops-body)] focus-within:ring-2 focus-within:ring-[var(--ops-accent)]">
      <OpsIcon name="calendar" size={15} />
      <select
        value={days}
        onChange={(e) => changeDays(Number(e.target.value) as DashboardDays)}
        aria-label="집계 기간"
        className="cursor-pointer appearance-none bg-transparent pr-5 outline-none [color-scheme:var(--native-color-scheme)]"
      >
        {DASHBOARD_PERIODS.map((d) => (
          <option key={d} value={d}>최근 {d}일</option>
        ))}
      </select>
      <OpsIcon name="chevDown" size={14} className="pointer-events-none absolute right-3.5" />
    </label>
  ) : undefined;

  return (
    <OpsLayout openInquiries={openCount}>
      <div className="flex w-full flex-col gap-4 px-4 pb-8 md:px-8">
        <div className="mb-2">
          <OpsPageHeader
            crumb="대시보드"
            title="운영 현황"
            description={metricsAvailable ? "전체 가입 회사와 현장 활동을 한눈에 확인하세요." : "회사에서 보낸 문의 처리 현황을 한눈에 확인하세요."}
            actions={periodSelect}
          />
        </div>

        {error && !items && !summary ? (
          <div className={`${CARD} flex flex-col items-center gap-3 p-10`}>
            <p role="alert" className="text-sm text-[var(--color-danger-text)]">{error}</p>
            <button type="button" onClick={() => void load(days)} className="rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] px-4 py-2 text-[13px] font-medium text-[var(--ops-body)]">다시 시도</button>
          </div>
        ) : (
          <>
            {metricsError && (
              <p role="alert" className={`${CARD} px-4 py-3 text-sm text-[var(--color-danger-text)]`}>{metricsError}</p>
            )}

            {metricsAvailable ? (
              <section aria-label="운영 지표" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                <KpiCard label="가입 회사" value={summary?.companies.total} icon="building" delta={summary ? growth(summary.companies.change) : undefined} />
                <KpiCard label="등록 현장" value={summary?.sites.total} icon="mapPin" delta={summary ? growth(summary.sites.change) : undefined} />
                <KpiCard label="누적 기록" value={summary?.records.total} icon="file" delta={summary ? growth(summary.records.change) : undefined} />
                <KpiCard label="오늘 신규가입" value={summary?.signupsToday.today} icon="userCheck"
                  delta={summary ? { value: formatDiff(summary.signupsToday.today, summary.signupsToday.yesterday), caption: "어제 대비", trend: trendOf(summary.signupsToday.today, summary.signupsToday.yesterday) } : undefined} />
                <KpiCard label="오늘 업로드" value={summary?.uploadsToday.today} icon="upload"
                  delta={summary ? { value: formatRate(summary.uploadsToday.today, summary.uploadsToday.yesterday), caption: "어제 대비", trend: trendOf(summary.uploadsToday.today, summary.uploadsToday.yesterday) } : undefined} />
                <KpiCard label="미답변 문의" value={openCount} icon="message" chip={openCount ? "답변 필요" : undefined} />
              </section>
            ) : (
              <section aria-label="문의 지표" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard label="미답변 문의" value={openCount} icon="message" chip={openCount ? "답변 필요" : undefined} />
                <KpiCard label="답변 완료" value={inquirySummary?.answered ?? null} icon="message" />
                <KpiCard label="종료" value={inquirySummary?.closed ?? null} icon="message" />
                <KpiCard label="전체 문의" value={inquirySummary?.total ?? null} icon="message" />
              </section>
            )}

            {openCount != null && openCount > 0 && (
              <section className={`${CARD} flex min-h-16 flex-wrap items-center justify-between gap-3 px-[19px] py-3`}>
                <div className="flex items-center gap-3.5">
                  <span className="flex size-8 items-center justify-center rounded-[9px] bg-[var(--ops-warning-bg)] text-[var(--ops-warning-fg)]">
                    <OpsIcon name="alert" />
                  </span>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-[var(--ops-heading)]">처리가 필요한 항목이 있어요</p>
                    <p className="text-[13px] text-[var(--ops-body)]">미답변 문의 {openCount}건</p>
                  </div>
                </div>
                <Link to="/ops/inquiries" className="flex h-9 items-center rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] px-3.5 text-[13px] font-medium text-[var(--ops-body)] transition-colors hover:bg-[var(--ops-chip-bg)]">
                  문의 확인
                </Link>
              </section>
            )}

            <div className={`grid gap-4 ${access === null ? "" : "lg:grid-cols-2"}`}>
              <Panel icon="message" title="최근 문의" action={<ViewAll to="/ops/inquiries?tab=all" />} className="min-h-[280px]">
                {!inquirySummary ? (
                  <p role={error ? "alert" : "status"} className={`pt-6 text-sm ${error ? "text-[var(--color-danger-text)]" : "text-[var(--ops-faint)]"}`}>
                    {error || "불러오는 중..."}
                  </p>
                ) : inquirySummary.recent.length === 0 ? (
                  <p className="pt-6 text-sm text-[var(--ops-faint)]">아직 접수된 문의가 없어요.</p>
                ) : (
                  <ul className="mt-3 flex flex-col divide-y divide-[var(--ops-divider)]">
                    {inquirySummary.recent.map((item) => (
                      <li key={item.inquiryId}>
                        <Link
                          to={`/ops/inquiries?tab=all&id=${encodeURIComponent(item.inquiryId)}`}
                          className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-[var(--ops-chip-bg)]"
                        >
                          <OpsIcon name="message" className="text-[var(--ops-faint)]" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ops-heading)]">{item.title}</span>
                          <span className="hidden shrink-0 text-xs text-[var(--ops-faint)] sm:inline">{formatDateTime(item.createdAt)}</span>
                          <StatusChip status={item.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              {access !== null && (
                <Panel icon="pie" title="사이트 접속 비중" className="min-h-[280px]"
                  action={<span className="text-xs text-[var(--ops-faint)]">최근 {days}일 · 관리자 로그인</span>}>
                  {!access ? (
                    <p role="status" className="pt-6 text-sm text-[var(--ops-faint)]">불러오는 중...</p>
                  ) : (
                    <>
                      <AccessDonut access={access} />
                      <p className="pt-3 text-xs text-[var(--ops-faint)]">
                        {access.firstRecordedLoginAt
                          ? `${formatDateTime(access.firstRecordedLoginAt, false)}부터 기록된 로그인만 집계돼요.`
                          : "아직 기록된 로그인이 없어요. 로그인 기록은 서버 업데이트 이후부터 쌓여요."}
                      </p>
                    </>
                  )}
                </Panel>
              )}
            </div>
          </>
        )}
      </div>
    </OpsLayout>
  );
}
