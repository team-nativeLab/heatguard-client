import { useCallback, useMemo, useRef, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import OpsLayout from "../../components/ops/OpsLayout";
import { AccountIcon, CheckIcon, CloseIcon, ContactIcon, DashboardIcon, RecordsIcon } from "../../components/icons/Icons";
import { CameraIcon, ChevronDownIcon, ChevronRightIcon, MapPinIcon, TriangleAlertIcon } from "../../components/home/HomeIcons";
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
 * 운영 현황 대시보드 (Figma 01_대시보드).
 * - 운영 지표·접속 비중: GET /api/v1/ops/dashboard/summary, /access (현재 DB 기준)
 * - 문의 지표·최근 문의: 문의 목록
 * 대시보드 API가 없는 서버에서는 문의 지표만 보여준다.
 * 가입 승인·입금 대기(최근 가입 신청)는 서버 기능이 없어 넣지 않았다.
 */

const REFRESH_MS = 60_000;

/** 아직 불러오는 중이면 undefined, 서버에 API가 없으면 null */
type Loaded<T> = T | null | undefined;

interface Delta {
  value: string;
  caption: string;
  trend: "up" | "down" | "flat";
}

function StatCard({ label, value, Icon, tone = "default", badge, delta }: {
  label: string;
  value: number | null | undefined;
  Icon: ComponentType<{ className?: string }>;
  tone?: "default" | "warning";
  badge?: string;
  delta?: Delta;
}) {
  const deltaTone = delta?.trend === "up"
    ? "text-[var(--color-accent)]"
    : delta?.trend === "down"
      ? "text-[var(--color-danger-text)]"
      : "text-[var(--color-text-label)]";
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone === "warning" ? "bg-[var(--color-warning-soft-bg,#fff4e5)] text-[var(--color-warning-text,#c2410c)]" : "bg-[var(--home-nav-active-bg)] text-[var(--color-accent)]"}`}>
          <Icon className="size-4" />
        </span>
        <span className="truncate whitespace-nowrap text-sm text-[var(--color-text-body)]" title={label}>{label}</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-end justify-between gap-2">
          <span className="font-mono-num text-2xl font-semibold text-[var(--color-text-heading)]">
            {value == null ? "–" : formatCount(value)}
          </span>
          {badge && (
            <span className="shrink-0 rounded-full bg-[var(--color-warning-soft-bg,#fff4e5)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-warning-text,#c2410c)]">{badge}</span>
          )}
        </div>
        {delta && (
          <p className="flex flex-wrap items-baseline gap-x-1 text-xs">
            <span className={`font-mono-num font-medium ${deltaTone}`}>{delta.value}</span>
            <span className="text-[var(--color-text-faint)]">{delta.caption}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OpsInquiry["status"] }) {
  const tone = status === "OPEN"
    ? "bg-[var(--color-warning-soft-bg,#fff4e5)] text-[var(--color-warning-text,#c2410c)]"
    : "bg-[var(--color-bg-tile)] text-[var(--color-text-label)]";
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{STATUS_LABEL[status]}</span>;
}

const SHARE_COLORS = ["bg-[var(--color-accent)]", "bg-[var(--color-accent)]/40"];

function AccessPanel({ access, days }: { access: DashboardAccess | undefined; days: number }) {
  const shares = access ? accessShares(access.items) : [];
  return (
    <section aria-label="사이트 접속 비중" className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold text-[var(--color-text-heading)]">사이트 접속 비중</h2>
        <p className="text-xs text-[var(--color-text-faint)]">최근 {days}일 · 관리자 로그인 횟수 기준</p>
      </div>
      {!access ? (
        <p role="status" className="text-sm text-[var(--color-text-faint)]">불러오는 중...</p>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono-num text-2xl font-semibold text-[var(--color-text-heading)]">{formatCount(access.total)}</span>
            <span className="text-sm text-[var(--color-text-body)]">회</span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-tile)]" aria-hidden>
            {access.total > 0 && access.items.map((item, i) => (
              <span key={item.role} className={SHARE_COLORS[i % SHARE_COLORS.length]} style={{ width: `${shares[i]}%` }} />
            ))}
          </div>
          <ul className="flex flex-col gap-2.5">
            {access.items.map((item, i) => (
              <li key={item.role} className="flex items-center gap-2 text-sm">
                <span className={`size-2.5 shrink-0 rounded-full ${SHARE_COLORS[i % SHARE_COLORS.length]}`} aria-hidden />
                <span className="text-[var(--color-text-heading)]">{item.label}</span>
                <span className="font-mono-num ml-auto font-medium text-[var(--color-text-heading)]">{shares[i].toFixed(1)}%</span>
                <span className="font-mono-num w-16 text-right text-xs text-[var(--color-text-faint)]">{formatCount(item.count)}회</span>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-[var(--color-text-faint)]">
            {access.firstRecordedLoginAt
              ? `${formatDateTime(access.firstRecordedLoginAt, false)}부터 기록된 로그인만 집계돼요.`
              : "아직 기록된 로그인이 없어요. 로그인 기록은 서버 업데이트 이후부터 쌓여요."}
          </p>
        </>
      )}
    </section>
  );
}

export default function OpsDashboardPage() {
  const [days, setDays] = useState<DashboardDays>(DEFAULT_DASHBOARD_DAYS);
  const [items, setItems] = useState<OpsInquiry[] | null>(null);
  const [summary, setSummary] = useState<Loaded<DashboardSummary>>(undefined);
  const [access, setAccess] = useState<Loaded<DashboardAccess>>(undefined);
  const [error, setError] = useState("");
  const [metricsError, setMetricsError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
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

    if (inquiries.status === "fulfilled") setUpdatedAt(new Date());
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

  const inquirySummary = useMemo(() => (items ? summarizeInquiries(items) : null), [items]);
  const openCount = inquirySummary?.open ?? (summary ? summary.openInquiries : null);
  const metricsAvailable = summary !== null;
  const newCaption = `최근 ${days}일 신규`;

  return (
    <OpsLayout>
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 p-4 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-[var(--color-text-faint)]">대시보드</p>
            <h1 className="text-2xl font-semibold text-[var(--color-text-heading)]">운영 현황</h1>
            <p className="text-sm text-[var(--color-text-body)]">
              {metricsAvailable ? "서비스 이용 현황과 문의 처리 현황을 한눈에 확인하세요." : "회사에서 보낸 문의 처리 현황을 한눈에 확인하세요."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {metricsAvailable && (
              <label className="relative inline-flex items-center">
                <select
                  value={days}
                  onChange={(e) => changeDays(Number(e.target.value) as DashboardDays)}
                  aria-label="집계 기간"
                  className="h-9 cursor-pointer appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] pl-3 pr-9 text-sm text-[var(--color-text-label)] outline-none [color-scheme:var(--native-color-scheme)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                >
                  {DASHBOARD_PERIODS.map((d) => (
                    <option key={d} value={d}>최근 {d}일</option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 size-3.5 text-[var(--color-text-body)]" />
              </label>
            )}
            {updatedAt && (
              <p className="text-xs text-[var(--color-text-faint)]">
                {formatDateTime(updatedAt.toISOString())} 기준 · 1분마다 갱신
              </p>
            )}
          </div>
        </div>

        {error && !items && !summary ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-10">
            <p role="alert" className="text-sm text-[var(--color-danger-text)]">{error}</p>
            <button type="button" onClick={() => void load(days)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm">다시 시도</button>
          </div>
        ) : (
          <>
            {metricsError && (
              <p role="alert" className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
                {metricsError}
              </p>
            )}

            {metricsAvailable ? (
              <section aria-label="운영 지표" className="grid grid-cols-2 gap-3 md:grid-cols-3 min-[1440px]:grid-cols-6">
                <StatCard label="가입 회사" value={summary?.companies.total} Icon={DashboardIcon}
                  delta={summary ? { value: formatNew(summary.companies.change), caption: newCaption, trend: summary.companies.change > 0 ? "up" : "flat" } : undefined} />
                <StatCard label="등록 현장" value={summary?.sites.total} Icon={MapPinIcon}
                  delta={summary ? { value: formatNew(summary.sites.change), caption: newCaption, trend: summary.sites.change > 0 ? "up" : "flat" } : undefined} />
                <StatCard label="누적 기록" value={summary?.records.total} Icon={RecordsIcon}
                  delta={summary ? { value: formatNew(summary.records.change), caption: newCaption, trend: summary.records.change > 0 ? "up" : "flat" } : undefined} />
                <StatCard label="오늘 신규가입" value={summary?.signupsToday.today} Icon={AccountIcon}
                  delta={summary ? { value: formatDiff(summary.signupsToday.today, summary.signupsToday.yesterday), caption: "어제 대비", trend: trendOf(summary.signupsToday.today, summary.signupsToday.yesterday) } : undefined} />
                <StatCard label="오늘 업로드" value={summary?.uploadsToday.today} Icon={CameraIcon}
                  delta={summary ? { value: formatRate(summary.uploadsToday.today, summary.uploadsToday.yesterday), caption: "어제 대비", trend: trendOf(summary.uploadsToday.today, summary.uploadsToday.yesterday) } : undefined} />
                <StatCard label="미답변 문의" value={openCount} Icon={ContactIcon} tone="warning" badge={openCount ? "답변 필요" : undefined} />
              </section>
            ) : (
              <section aria-label="문의 지표" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="미답변 문의" value={openCount} Icon={ContactIcon} tone="warning" badge={openCount ? "답변 필요" : undefined} />
                <StatCard label="답변 완료" value={inquirySummary?.answered ?? null} Icon={CheckIcon} />
                <StatCard label="종료" value={inquirySummary?.closed ?? null} Icon={CloseIcon} />
                <StatCard label="전체 문의" value={inquirySummary?.total ?? null} Icon={ContactIcon} />
              </section>
            )}

            {openCount != null && openCount > 0 && (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-warning-soft-bg,#fff4e5)] text-[var(--color-warning-text,#c2410c)]">
                    <TriangleAlertIcon className="size-4" />
                  </span>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-[var(--color-text-heading)]">처리가 필요한 항목이 있어요</p>
                    <p className="text-xs text-[var(--color-text-body)]">미답변 문의 {openCount}건</p>
                  </div>
                </div>
                <Link to="/ops/inquiries" className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110">
                  문의 확인
                </Link>
              </section>
            )}

            <div className={`grid gap-6 ${access === null ? "" : "lg:grid-cols-[minmax(0,1fr)_320px]"}`}>
              <section className="flex min-w-0 flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <div className="flex items-center justify-between px-5 pb-2 pt-4">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-heading)]">
                    <ContactIcon className="size-4" />
                    최근 문의
                  </h2>
                  <Link to="/ops/inquiries?tab=all" className="flex items-center gap-0.5 text-sm text-[var(--color-text-body)] hover:text-[var(--color-text-heading)]">
                    전체 보기 <ChevronRightIcon className="size-3.5" />
                  </Link>
                </div>
                {!inquirySummary ? (
                  <p role={error ? "alert" : "status"} className={`px-5 pb-5 pt-2 text-sm ${error ? "text-[var(--color-danger-text)]" : "text-[var(--color-text-faint)]"}`}>
                    {error || "불러오는 중..."}
                  </p>
                ) : inquirySummary.recent.length === 0 ? (
                  <p className="px-5 pb-5 pt-2 text-sm text-[var(--color-text-faint)]">아직 접수된 문의가 없어요.</p>
                ) : (
                  <ul className="flex flex-col px-2 pb-2">
                    {inquirySummary.recent.map((item) => (
                      <li key={item.inquiryId}>
                        <Link
                          to={`/ops/inquiries?tab=all&id=${encodeURIComponent(item.inquiryId)}`}
                          className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[var(--color-bg-tile)]"
                        >
                          <ContactIcon className="size-4 shrink-0 text-[var(--color-text-faint)]" />
                          <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-text-heading)]">{item.title}</span>
                          <span className="hidden shrink-0 text-xs text-[var(--color-text-faint)] sm:inline">{formatDateTime(item.createdAt)}</span>
                          <StatusBadge status={item.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {access !== null && <AccessPanel access={access} days={days} />}
            </div>
          </>
        )}
      </div>
    </OpsLayout>
  );
}
