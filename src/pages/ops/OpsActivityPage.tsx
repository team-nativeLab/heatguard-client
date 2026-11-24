import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OpsLayout, { OpsPageHeader } from "../../components/ops/OpsLayout";
import OpsIcon from "../../components/ops/OpsIcon";
import { CARD } from "../../components/ops/opsStyles";
import { BTN_SECONDARY, CenterMessage, Chip, OpsSelect, PillTabs, UnavailableState } from "../../components/ops/OpsUi";
import { errorMessage, opsAdminApi } from "../../api";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABEL, groupByDay, timeOfDay, type ActivityLog, type ActivityType } from "../../lib/opsAdmin";
import { formatDateTime } from "../../lib/opsInquiry";
import { downloadCsv, toCsv } from "../../lib/csv";

/*
 * 활동 로그 (Figma 05_활동 로그, node 2958:1609).
 * API: GET /api/v1/ops/activity-logs?type&days&companyId&cursor
 * 회원 관리 상세의 "활동 로그"에서 ?companyId= 로 들어오면 그 회사만 본다.
 * 서버에 아직 없으면 "서버 준비 중"을 보여준다.
 */

type Tab = "all" | ActivityType;

const PERIOD_OPTIONS = [
  { value: "1", label: "오늘" },
  { value: "7", label: "최근 7일" },
  { value: "30", label: "최근 30일" },
  { value: "90", label: "최근 90일" },
];

export default function OpsActivityPage() {
  const [params, setParams] = useSearchParams();
  const companyId = params.get("companyId") ?? undefined;
  const [tab, setTab] = useState<Tab>("all");
  const [days, setDays] = useState("7");

  const [items, setItems] = useState<ActivityLog[] | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async (more?: string) => {
    const id = ++seq.current;
    if (more) setLoadingMore(true);
    try {
      const res = await opsAdminApi.listActivityLogs({ type: tab === "all" ? undefined : tab, days: Number(days), companyId, cursor: more });
      if (id !== seq.current) return;
      if (res === null) {
        setUnavailable(true);
        return;
      }
      setItems((prev) => (more && prev ? [...prev, ...res.items] : res.items));
      setCursor(res.page.nextCursor);
      setError("");
    } catch (err) {
      if (id === seq.current) setError(errorMessage(err, "활동 로그를 불러오지 못했어요."));
    } finally {
      if (id === seq.current) setLoadingMore(false);
    }
  }, [tab, days, companyId]);

  useEffect(() => {
    setItems(null);
    void load();
  }, [load]);

  const groups = useMemo(() => (items ? groupByDay(items) : []), [items]);
  // 회원 관리 상세에서 넘어올 때 회사 이름을 함께 받는다 (필터 표시용)
  const companyName = companyId ? params.get("companyName") ?? undefined : undefined;

  const [exporting, setExporting] = useState(false);
  // 불러온 쪽만이 아니라 현재 조건의 로그 전체를 내보낸다 (최대 50쪽).
  const exportCsv = async () => {
    if (!items?.length || exporting) return;
    setExporting(true);
    const all = [...items];
    try {
      let next = cursor;
      for (let page = 0; next && page < 50; page += 1) {
        const res = await opsAdminApi.listActivityLogs({ type: tab === "all" ? undefined : tab, days: Number(days), companyId, cursor: next });
        if (!res) break;
        all.push(...res.items);
        next = res.page.nextCursor;
      }
    } catch {
      // 실패하면 불러온 만큼만 내보낸다.
    } finally {
      setExporting(false);
    }
    downloadCsv(
      `활동로그_${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(["시간", "유형", "회사", "사용자", "내용", "IP"], all.map((i) => [formatDateTime(i.at), i.label, i.companyName, i.actorName, i.message, i.ip])),
    );
  };

  const tabs: { key: Tab; label: string }[] = [{ key: "all", label: "전체" }, ...ACTIVITY_TYPES.map((t) => ({ key: t, label: ACTIVITY_TYPE_LABEL[t] }))];

  return (
    <OpsLayout>
      <div className="flex w-full flex-col gap-4 px-4 pb-8 md:px-8">
        <div className="mb-2">
          <OpsPageHeader
            crumb="운영 › 활동 로그"
            title="활동 로그"
            description="회사와 관리자의 주요 활동을 시간순으로 확인해요."
            actions={!unavailable && (
              <button type="button" onClick={() => void exportCsv()} disabled={!items?.length || exporting} className={BTN_SECONDARY}>
                <OpsIcon name="download" size={15} />
                {exporting ? "내보내는 중..." : "CSV 내보내기"}
              </button>
            )}
          />
        </div>

        {unavailable ? (
          <UnavailableState feature="활동 로그" />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <PillTabs label="활동 유형" tabs={tabs} value={tab} onChange={setTab} />
              <span className="flex-1" />
              <OpsSelect label="기간" icon="calendar" value={days} onChange={setDays} options={PERIOD_OPTIONS} />
              {companyId && (
                <span className="inline-flex h-[38px] items-center gap-2 rounded-[10px] border border-[var(--ops-border)] bg-[var(--ops-surface)] pl-3 pr-1.5 text-[13px] font-medium text-[var(--ops-body)]">
                  <OpsIcon name="building" size={15} />
                  {companyName ?? "선택한 회사"}
                  <button
                    type="button"
                    aria-label="회사 필터 해제"
                    onClick={() => { params.delete("companyId"); params.delete("companyName"); setParams(params, { replace: true }); }}
                    className="flex size-6 items-center justify-center rounded-md hover:bg-[var(--ops-chip-bg)]"
                  >
                    <OpsIcon name="close" size={11} />
                  </button>
                </span>
              )}
            </div>

            <section aria-label="활동 로그 목록" className={`${CARD} flex min-h-[320px] flex-col overflow-hidden`}>
              {error && !items ? (
                <CenterMessage tone="danger">{error}</CenterMessage>
              ) : !items ? (
                <CenterMessage>불러오는 중...</CenterMessage>
              ) : items.length === 0 ? (
                <CenterMessage>이 기간에 기록된 활동이 없어요.</CenterMessage>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-[13px]">
                    <thead className="bg-[var(--ops-bg)] text-xs text-[var(--ops-faint)]">
                      <tr>
                        {["시간", "유형", "회사", "사용자", "내용", "IP"].map((h) => (
                          <th key={h} scope="col" className="px-4 py-2.5 text-left font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((g) => (
                        <Fragment key={g.key}>
                          <tr className="border-t border-[var(--ops-divider)] bg-[var(--ops-bg)]">
                            <th scope="rowgroup" colSpan={6} className="px-4 py-2 text-left text-xs font-bold text-[var(--ops-body)]">{g.title}</th>
                          </tr>
                          {g.items.map((log) => (
                            <tr key={log.logId} className="border-t border-[var(--ops-divider)]">
                              <td className="font-mono-num whitespace-nowrap px-4 py-3 text-[var(--ops-heading)]">{timeOfDay(log.at)}</td>
                              <td className="px-4 py-3"><Chip tone={log.tone}>{log.label}</Chip></td>
                              <td className="px-4 py-3 font-bold text-[var(--ops-heading)]">{log.companyName ?? "–"}</td>
                              <td className="px-4 py-3 text-[var(--ops-body)]">{log.actorName ?? "–"}</td>
                              <td className="px-4 py-3 text-[var(--ops-heading)]">{log.message}</td>
                              <td className="font-mono-num px-4 py-3 text-xs text-[var(--ops-faint)]">{log.ip ?? "–"}</td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {cursor && (
              <button type="button" onClick={() => void load(cursor)} disabled={loadingMore} className={`${BTN_SECONDARY} self-center px-8`}>
                {loadingMore ? "불러오는 중..." : "이전 로그 더 보기"}
                <OpsIcon name="chevDown" size={14} />
              </button>
            )}
          </>
        )}
      </div>
    </OpsLayout>
  );
}
