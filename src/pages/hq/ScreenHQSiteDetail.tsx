import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import HQLayout, { HQContent } from "../../components/hq/HQLayout";
import RecordTable, { SiteHeatBadge } from "../../components/hq/RecordTable";
import { ErrorBlock, LoadingBlock } from "../../components/hq/LoadState";
import { hqApi, ApiError, errorMessage, type HqSiteDetail } from "../../api";
import { HEAT_LABEL, HEAT_TONE } from "../../api/hq";
import { doneText } from "../../lib/hqFormat";
import AppSiteLinkPanel from "../../components/hq/AppSiteLinkPanel";

export default function ScreenHQSiteDetail() {
  const { siteId = "" } = useParams();
  const [detail, setDetail] = useState<HqSiteDetail | null>(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setNotFound(false);
    try {
      setDetail(await hqApi.getSite(siteId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setError(errorMessage(err, "현장 정보를 불러오지 못했어요."));
    }
  }, [siteId]);

  useEffect(() => {
    setDetail(null);
    load();
  }, [load]);

  const site = detail?.site;

  return (
    <HQLayout>
      <HQContent>
        <Link to="/hq/sites" className="flex items-center gap-1.5 text-sm text-[var(--color-text-body)] transition-colors hover:text-[var(--color-text-heading)]">
          ← 현장 목록
        </Link>

        {notFound ? (
          <p className="pt-10 text-center text-sm text-[var(--color-text-faint)]">존재하지 않는 현장이에요.</p>
        ) : error ? (
          <div className="pt-6">
            <ErrorBlock message={error} onRetry={load} />
          </div>
        ) : !detail || !site ? (
          <LoadingBlock />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 pt-6">
              <h1 className="text-xl font-semibold text-[var(--color-text-heading)]">{site.name}</h1>
              <SiteHeatBadge temperature={site.temperature} label={HEAT_LABEL[site.heatLevel]} tone={HEAT_TONE[site.heatLevel]} />
              {!site.active && <span className="rounded bg-[var(--color-heat-none-bg)] px-2 py-0.5 text-[10px] text-[var(--color-heat-none-fg)]">비활성</span>}
            </div>
            {(site.managerName || site.managerEmail) && (
              <p className="pt-1 text-sm text-[var(--color-text-body)]">{[site.managerName, site.managerPhone, site.managerEmail].filter(Boolean).join(" · ")}</p>
            )}

            <AppSiteLinkPanel key={site.id} siteId={site.id} active={site.active} />

            <div className="flex flex-wrap gap-2 pt-6">
              {detail.teams.length === 0 && <span className="text-xs text-[var(--color-text-faint)]">등록된 팀이 없어요.</span>}
              {detail.teams.map((t) => (
                <span key={t.id || t.name} className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1 font-['JetBrains_Mono',monospace] text-xs text-[var(--color-text-label)]">
                  {t.name} {t.done != null && t.total != null ? doneText(t.done, t.total) : t.memberCount != null ? `${t.memberCount}명` : ""}
                </span>
              ))}
            </div>

            {detail.checklistItems.length > 0 && (
              <>
                <h2 className="pt-8 text-sm font-medium text-[var(--color-text-label)]">체크리스트 항목</h2>
                <ul className="flex flex-col gap-1.5 pt-3 text-sm text-[var(--color-text-body)]">
                  {detail.checklistItems.map((c) => (
                    <li key={c.id || c.text}>· {c.text}</li>
                  ))}
                </ul>
              </>
            )}

            <h2 className="pt-8 text-sm font-medium text-[var(--color-text-label)]">
              오늘 기록 <span className="font-normal text-[var(--color-text-faint)]">(읽기 전용)</span>
            </h2>
            <div className="pt-3">
              <RecordTable records={detail.todayRecords} />
            </div>
          </>
        )}
      </HQContent>
    </HQLayout>
  );
}
