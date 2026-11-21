import { useCallback, useMemo, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import OpsLayout from "../../components/ops/OpsLayout";
import { CheckIcon, CloseIcon, ContactIcon } from "../../components/icons/Icons";
import { ChevronRightIcon, TriangleAlertIcon } from "../../components/home/HomeIcons";
import { errorMessage, opsApi, type OpsInquiry } from "../../api";
import { usePolling } from "../../shared/hooks/usePolling";
import { STATUS_LABEL, formatDateTime, summarizeInquiries } from "../../lib/opsInquiry";

/*
 * 운영 현황 대시보드 (Figma 01_대시보드).
 * 서버에 운영자 통계 API가 없어, 문의 목록으로 계산할 수 있는 지표만 보여준다.
 * 가입 회사·등록 현장·누적 기록·가입 신청·접속 비중은 API가 생기면 추가한다.
 */

const REFRESH_MS = 60_000;

function StatCard({ label, value, Icon, tone = "default", badge }: {
  label: string;
  value: number | null;
  Icon: ComponentType<{ className?: string }>;
  tone?: "default" | "warning";
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone === "warning" ? "bg-[var(--color-warning-soft-bg,#fff4e5)] text-[var(--color-warning-text,#c2410c)]" : "bg-[var(--home-nav-active-bg)] text-[var(--color-accent)]"}`}>
          <Icon className="size-4" />
        </span>
        <span className="truncate whitespace-nowrap text-sm text-[var(--color-text-body)]" title={label}>{label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="font-mono-num text-2xl font-semibold text-[var(--color-text-heading)]">{value ?? "–"}</span>
        {badge && (
          <span className="rounded-full bg-[var(--color-warning-soft-bg,#fff4e5)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-warning-text,#c2410c)]">{badge}</span>
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

export default function OpsDashboardPage() {
  const [items, setItems] = useState<OpsInquiry[] | null>(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await opsApi.listInquiries();
      setItems(res.items);
      setError("");
      setUpdatedAt(new Date());
    } catch (err) {
      setError(errorMessage(err, "운영 현황을 불러오지 못했어요."));
    }
  }, []);

  // 탭이 가려져 있으면 갱신을 멈추고, 다시 보이면 바로 갱신한다.
  usePolling(load, REFRESH_MS, null);

  const summary = useMemo(() => (items ? summarizeInquiries(items) : null), [items]);

  return (
    <OpsLayout>
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 p-4 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-[var(--color-text-faint)]">대시보드</p>
            <h1 className="text-2xl font-semibold text-[var(--color-text-heading)]">운영 현황</h1>
            <p className="text-sm text-[var(--color-text-body)]">회사에서 보낸 문의 처리 현황을 한눈에 확인하세요.</p>
          </div>
          {updatedAt && (
            <p className="text-xs text-[var(--color-text-faint)]">
              {formatDateTime(updatedAt.toISOString())} 기준 · 1분마다 갱신
            </p>
          )}
        </div>

        {error && !items ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-10">
            <p role="alert" className="text-sm text-[var(--color-danger-text)]">{error}</p>
            <button type="button" onClick={() => void load()} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm">다시 시도</button>
          </div>
        ) : (
          <>
            <section aria-label="문의 지표" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="미답변 문의" value={summary?.open ?? null} Icon={ContactIcon} tone="warning" badge={summary && summary.open > 0 ? "답변 필요" : undefined} />
              <StatCard label="답변 완료" value={summary?.answered ?? null} Icon={CheckIcon} />
              <StatCard label="종료" value={summary?.closed ?? null} Icon={CloseIcon} />
              <StatCard label="전체 문의" value={summary?.total ?? null} Icon={ContactIcon} />
            </section>

            {summary && summary.open > 0 && (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-warning-soft-bg,#fff4e5)] text-[var(--color-warning-text,#c2410c)]">
                    <TriangleAlertIcon className="size-4" />
                  </span>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-[var(--color-text-heading)]">처리가 필요한 항목이 있어요</p>
                    <p className="text-xs text-[var(--color-text-body)]">미답변 문의 {summary.open}건</p>
                  </div>
                </div>
                <Link to="/ops/inquiries" className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110">
                  문의 확인
                </Link>
              </section>
            )}

            <section className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <div className="flex items-center justify-between px-5 pb-2 pt-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-heading)]">
                  <ContactIcon className="size-4" />
                  최근 문의
                </h2>
                <Link to="/ops/inquiries?tab=all" className="flex items-center gap-0.5 text-sm text-[var(--color-text-body)] hover:text-[var(--color-text-heading)]">
                  전체 보기 <ChevronRightIcon className="size-3.5" />
                </Link>
              </div>
              {!summary ? (
                <p role="status" className="px-5 pb-5 pt-2 text-sm text-[var(--color-text-faint)]">불러오는 중...</p>
              ) : summary.recent.length === 0 ? (
                <p className="px-5 pb-5 pt-2 text-sm text-[var(--color-text-faint)]">아직 접수된 문의가 없어요.</p>
              ) : (
                <ul className="flex flex-col px-2 pb-2">
                  {summary.recent.map((item) => (
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
          </>
        )}
      </div>
    </OpsLayout>
  );
}
