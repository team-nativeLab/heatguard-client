import { useCallback, useEffect, useMemo, useState } from "react";
import HQLayout, { HQContent } from "../../components/hq/HQLayout";
import RecordTable, { SiteHeatBadge } from "../../components/hq/RecordTable";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../components/hq/LoadState";
import { ChevronDownIcon } from "../../components/home/HomeIcons";
import { hqApi, errorMessage, type HqRecordRow, type HqSite } from "../../api";
import { heatLabel, heatTone } from "../../lib/hqFormat";

const todayKst = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

const filterCls =
  "h-[34px] rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] px-2.5 text-xs text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)]";

export default function ScreenHQRecords() {
  const [date, setDate] = useState(todayKst);
  const [siteId, setSiteId] = useState("");
  const [sites, setSites] = useState<HqSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState("");
  const [records, setRecords] = useState<HqRecordRow[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const loadSites = useCallback(async () => {
    setSitesError("");
    setSitesLoading(true);
    try {
      setSites(await hqApi.listAllSites());
    } catch (err) {
      setSitesError(errorMessage(err, "현장 목록을 불러오지 못했어요."));
    } finally {
      setSitesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // 필터가 바뀌면 커서를 지우고 첫 페이지부터 다시 조회한다.
  const load = useCallback(async () => {
    setError("");
    setRecords(null);
    setCursor(null);
    try {
      const res = await hqApi.listRecords({ date: date || undefined, siteId: siteId || undefined, limit: 50 });
      setRecords(res.items);
      setCursor(res.page?.nextCursor ?? null);
    } catch (err) {
      setError(errorMessage(err, "기록을 불러오지 못했어요."));
    }
  }, [date, siteId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await hqApi.listRecords({ date: date || undefined, siteId: siteId || undefined, limit: 50, cursor });
      setRecords((prev) => [...(prev ?? []), ...res.items]);
      setCursor(res.page?.nextCursor ?? null);
    } catch (err) {
      setError(errorMessage(err, "기록을 더 불러오지 못했어요."));
    } finally {
      setLoadingMore(false);
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, { siteId: string; name: string; rows: HqRecordRow[] }>();
    for (const r of records ?? []) {
      const key = r.siteId || r.siteName || "unknown";
      if (!map.has(key)) map.set(key, { siteId: r.siteId, name: r.siteName || "(현장 미상)", rows: [] });
      map.get(key)!.rows.push(r);
    }
    return [...map.values()].sort((a, b) => {
      const siteA = sites.find((site) => site.id === a.siteId);
      const siteB = sites.find((site) => site.id === b.siteId);
      if (!siteA) return siteB ? 1 : 0;
      if (!siteB) return -1;
      return siteB.heatLevel - siteA.heatLevel || (siteB.temperature ?? -1) - (siteA.temperature ?? -1);
    });
  }, [records, sites]);

  const siteOf = (g: { siteId: string; name: string }) => sites.find((s) => (g.siteId && s.id === g.siteId) || s.name === g.name);

  return (
    <HQLayout>
      <HQContent>
        <h1 className="text-xl font-semibold text-[var(--color-text-heading)]">전체 기록</h1>
        <p className="pt-1 text-sm text-[var(--color-text-body)]">소속 현장 전체 · {date || "전체 날짜"} 기준 · 최근 활동 순</p>

        <div className="flex flex-wrap items-center gap-2 pt-5">
          <input type="date" value={date} max={todayKst()} onChange={(e) => setDate(e.target.value)} className={filterCls} aria-label="날짜" />
          <label className="relative inline-flex items-center">
            <span className="sr-only">현장 필터</span>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className={`${filterCls} appearance-none pr-8`}
              aria-label="현장"
            >
              <option value="">전체 현장</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.active ? s.name : `${s.name} (비활성 · 기록 보존)`}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2 size-3.5 text-[var(--color-text-body)]" />
          </label>
        </div>

        {sitesError && <div className="pt-3"><ErrorBlock message={sitesError} onRetry={loadSites} /></div>}

        <div className="flex flex-col gap-10 pt-8">
          {error ? (
            <ErrorBlock message={error} onRetry={load} />
          ) : records === null ? (
            <LoadingBlock />
          ) : groups.length === 0 ? (
            <EmptyBlock>해당 조건의 기록이 없어요.</EmptyBlock>
          ) : (
            groups.map((g) => {
              const site = siteOf(g);
              return (
                <section key={g.siteId || g.name}>
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-medium text-[var(--color-text-heading)]">{g.name}</h2>
                    {site && !site.active && <span className="rounded bg-[var(--color-heat-none-bg)] px-1.5 py-0.5 text-[10px] text-[var(--color-heat-none-fg)]">비활성 · 기록 보존</span>}
                    {site && <SiteHeatBadge temperature={site.temperature} label={heatLabel(site)} tone={heatTone(site)} />}
                    <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--color-text-faint)]">{g.rows.length}건 표시</span>
                  </div>
                  <div className="pt-3">
                    <RecordTable records={g.rows} />
                  </div>
                </section>
              );
            })
          )}
          {cursor && (
            <button type="button" onClick={loadMore} disabled={loadingMore} className="mx-auto h-9 rounded-lg border border-[var(--color-border)] px-5 text-sm text-[var(--color-text-label)] transition hover:border-[var(--color-accent)] disabled:opacity-60">
              {loadingMore ? "불러오는 중..." : "더 보기"}
            </button>
          )}
        </div>
      </HQContent>
    </HQLayout>
  );
}

