import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import HQLayout, { HQContent } from "../../components/hq/HQLayout";
import { SiteHeatBadge } from "../../components/hq/RecordTable";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../components/hq/LoadState";
import { hqApi, errorMessage, type HqDashboard, type HqSite, type HqSiteWeather } from "../../api";
import { useHqMe } from "../../hooks/useHqMe";
import { usePolling } from "../../shared/hooks/usePolling";
import { doneText, heatLabel, heatTone, tempText } from "../../lib/hqFormat";
import { ChevronDownIcon } from "../../components/home/HomeIcons";
import {
  AlertStatIcon,
  BuildingStatIcon,
  ChevronStatIcon,
  HeatStatIcon,
  PinStatIcon,
  RecordStatIcon,
  SearchStatIcon,
} from "../../components/hq/StatIcons";

const TONE_CLASS = {
  blue: "bg-[var(--home-stat-blue-bg)] text-[var(--home-stat-blue-fg)]",
  green: "bg-[var(--home-stat-green-bg)] text-[var(--home-stat-green-fg)]",
  purple: "bg-[var(--home-stat-purple-bg)] text-[var(--home-stat-purple-fg)]",
  red: "bg-[var(--home-stat-red-bg)] text-[var(--home-stat-red-fg)]",
} as const;

function doneClass(tone: string) {
  if (tone === "red") return "text-[var(--color-heat-red-fg)]";
  if (tone === "orange") return "text-[var(--color-heat-orange-fg)]";
  if (tone === "yellow") return "text-[var(--color-heat-yellow-fg)]";
  return "text-[var(--color-success)]";
}

function StatTile({ icon, count, unit, label, tone, to }: { icon: ReactNode; count: number; unit: string; label: string; tone: keyof typeof TONE_CLASS; to?: string }) {
  const body = (
    <>
      <span className="size-6">{icon}</span>
      <p className={`mt-[15px] text-[30px] font-semibold leading-[30px] ${tone === "red" ? "text-[var(--home-stat-red-fg)]" : "text-[var(--color-text-heading)]"}`}>
        {count}
        <span className="ml-0.5 text-base font-normal leading-6">{unit}</span>
      </p>
      <p className="mt-auto pb-2.5 text-[11px] leading-[16.5px] text-[var(--color-text-body)]">{label}</p>
    </>
  );
  const cls = `flex h-[132px] flex-col items-center rounded-[10px] pt-[26px] ${TONE_CLASS[tone]}`;
  return to ? (
    <Link to={to} className={`${cls} transition hover:brightness-[0.97]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");

export default function ScreenHQDashboard() {
  const me = useHqMe();
  const [data, setData] = useState<HqDashboard | null>(null);
  const [sites, setSites] = useState<HqSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedWeather, setSelectedWeather] = useState<HqSiteWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [error, setError] = useState("");

  // 대시보드 요약 + 위험도 순 현장 목록. 30초마다 새로 고친다.
  const load = useCallback(async () => {
    try {
      const dash = await hqApi.getDashboard();
      const list = dash.sitesByRisk.length > 0 ? dash.sitesByRisk : await hqApi.listAllSites();
      const orderedSites = [...list].sort((a, b) => {
        if (a.temperature == null && b.temperature != null) return 1;
        if (b.temperature == null && a.temperature != null) return -1;
        return (b.temperature ?? 0) - (a.temperature ?? 0) || (b.heatLevel ?? -1) - (a.heatLevel ?? -1);
      });
      setData(dash);
      setSites(orderedSites);
      setSelectedSiteId((current) => current && orderedSites.some((site) => site.id === current) ? current : orderedSites[0]?.id ?? "");
      setError("");
    } catch (err) {
      setError(errorMessage(err, "대시보드를 불러오지 못했어요."));
    }
  }, []);
  usePolling(load, 30_000, 120_000);
  useEffect(() => {
    if (!selectedSiteId) {
      setSelectedWeather(null);
      setWeatherError("");
      return;
    }
    let alive = true;
    setWeatherLoading(true);
    hqApi.getSiteWeather(selectedSiteId)
      .then((result) => { if (alive) { setSelectedWeather(result); setWeatherError(""); } })
      .catch((err) => { if (alive) setWeatherError(errorMessage(err, "현장 날씨를 불러오지 못했어요.")); })
      .finally(() => { if (alive) setWeatherLoading(false); });
    return () => { alive = false; };
  }, [selectedSiteId]);
  const [now, setNow] = useState(() => new Date());
  const [search, setSearch] = useState("");

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const dateText = `${now.getFullYear()}. ${pad(now.getMonth() + 1)}. ${pad(now.getDate())}. (${WEEKDAYS[now.getDay()]})`;
  const timeText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const selectedSite = sites.find((site) => site.id === selectedSiteId);
  const glowColor = "rgba(96, 165, 250, 0.38)";
  const weatherStatus = weatherError
    ? "조회 실패"
    : weatherLoading
      ? "날씨 조회 중"
      : !selectedSite
        ? "현장 없음"
        : selectedWeather?.availability === "LOCATION_REQUIRED"
          ? "위치 미등록"
          : selectedWeather?.availability === "UNAVAILABLE"
            ? "날씨 조회 불가"
            : selectedWeather?.availability === "CACHED" || selectedWeather?.isStale
              ? "이전 관측값"
              : heatLabel(selectedSite);
  const topTemp = selectedWeather?.temperature ?? null;
  const weather = selectedWeather;
  const visible = sites.filter((s) => s.name.includes(search.trim()));

  return (
    <HQLayout>
      <HQContent maxWidth={1600}>
        <header className="flex min-h-[74px] flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[13px] text-[var(--color-text-body)]">안녕하세요, {me ? `${me.user.name} 님` : ""}</p>
            <h1 className="whitespace-nowrap text-[19px] font-bold leading-[1.4] text-[var(--color-text-heading)]">오늘도 안전한 현장을 만들어가요.</h1>
          </div>
          <div className="flex w-full items-center gap-3 pt-0.5 sm:w-auto">
            <label className="relative flex h-[38px] w-full items-center rounded-[10px] border border-[var(--home-search-border)] bg-[var(--home-search-bg)] transition-colors focus-within:border-[var(--color-accent)] sm:w-[260px]">
              <span className="absolute left-3 text-[var(--color-text-body)]">
                <SearchStatIcon />
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="현장, 기록, 작업자를 검색하세요..."
                className="h-full w-full bg-transparent pl-[35px] pr-2 text-[12.5px] text-[var(--color-text-heading)] outline-none placeholder:text-[var(--color-text-body)]"
              />
            </label>
          </div>
        </header>

        <section className="mt-0.5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div
            className="relative flex min-h-[275px] flex-col overflow-hidden rounded-xl border border-[var(--home-card-border)] p-5"
            style={{ background: `linear-gradient(110deg, color-mix(in srgb, ${glowColor} 58%, var(--home-card-bg)) 0%, var(--home-card-bg) 100%)` }}
          >
            <div className="relative flex flex-wrap items-center justify-start gap-2">
              <label className="relative flex h-[30px] max-w-full items-center gap-1.5 rounded-full border border-[var(--home-pill-border)] bg-[var(--home-pill-bg)] pl-[11px] pr-2 text-xs font-medium text-[var(--home-pill-fg)]">
                <PinStatIcon />
                <span className="sr-only">현장 선택</span>
                <select aria-label="현장 선택" value={selectedSiteId} onChange={(event) => setSelectedSiteId(event.target.value)} className="max-w-[180px] cursor-pointer appearance-none truncate bg-transparent pr-4 outline-none">
                  {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2 size-3.5 text-[var(--color-text-body)]" />
              </label>
              <span className="rounded-full bg-[var(--color-danger-soft-bg)] px-2.5 py-1 text-xs font-medium leading-4 text-[var(--color-danger-text)]">
                <span className="figma-emoji">☀</span> ${weatherStatus}
              </span>
            </div>

            {/* 헤더와 하단 타일 사이의 정중앙에 온도 영역과 날씨 아이콘을 맞춘다 */}
            <div className="relative flex flex-1 flex-col justify-center py-4">
              {/* 날씨 아이콘 + 글로우: 한 묶음으로 두어 블러가 항상 아이콘 정중앙에 오도록 한다 */}
              <div aria-hidden="true" className="pointer-events-none absolute right-[52px] top-1/2 z-10 w-[104px] -translate-y-1/2 select-none">
                <span
                  className="absolute left-1/2 top-1/2 size-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`, filter: "blur(14px)" }}
                />
                <img src="/sun.png" alt="" draggable={false} className="relative h-auto w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]" />
              </div>

              <p className="relative text-[15px] font-medium leading-5 text-[var(--color-text-label)]">선택 현장 온도</p>
              <div className="relative flex h-[64px] items-end gap-3 pt-1">
                <span className="text-[56px] font-semibold leading-[56px] tracking-[-1.5px] text-[var(--color-text-heading)]">{topTemp != null ? topTemp.toFixed(1) : "-"}</span>
                {topTemp != null && (
                  <div className="flex items-center gap-2 pb-1.5">
                    <span className="text-[24px] font-medium leading-8 text-[var(--color-text-heading)]">°C</span>
                  </div>
                )}
              </div>
              <p className="relative whitespace-pre pt-2 text-[15px] font-medium leading-5 text-[var(--color-text-label)]">
                {`습도 ${weather?.humidity != null ? `${weather.humidity}%` : "-"}  |  체감온도 ${tempText(weather?.apparentTemperature) || "-"}`}
              </p>
            </div>

            <div className="relative grid grid-cols-3 gap-3">
              {[
                ["습도", weather?.humidity != null ? `${weather.humidity}%` : "-"],
                ["체감온도", tempText(weather?.apparentTemperature) || "-"],
                ["날씨", weather?.skyStatus || "-"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[var(--home-weather-tile-border)] bg-[var(--home-weather-tile-bg)] px-3 py-2 backdrop-blur-[2px]">
                  <p className="text-xs leading-4 text-[var(--color-text-body)]">{label}</p>
                  <p className="pt-0.5 font-['JetBrains_Mono',monospace] text-sm font-medium leading-5 text-[var(--color-text-value)]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-h-[275px] flex-col rounded-xl border border-[var(--home-card-border)] bg-[var(--home-card-bg)] p-5">
            <div className="flex items-start justify-between">
              <h2 className="text-sm font-medium leading-5 text-[var(--color-text-label)]">오늘의 현황</h2>
              <div className="flex flex-col items-end text-right">
                <p className="whitespace-nowrap text-sm leading-5 text-[var(--color-text-body)]">{dateText}</p>
                <p className="pt-1 text-[40px] font-light leading-[44px] tracking-[-1.2px] tabular-nums text-[var(--color-text-heading)]">{timeText}</p>
              </div>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-3 pb-2 pt-6 sm:grid-cols-4">
              <StatTile tone="blue" icon={<BuildingStatIcon />} count={data?.summary.siteCount ?? sites.length} unit="곳" label="관리 현장" to="/hq/sites" />
              <StatTile tone="green" icon={<RecordStatIcon />} count={data?.summary.todayRecordCount ?? 0} unit="건" label="오늘 기록" to="/hq/records" />
              <StatTile tone="purple" icon={<HeatStatIcon />} count={data?.summary.dangerSiteCount ?? 0} unit="곳" label="폭염경보 이상" to="/hq/sites" />
              <StatTile tone="red" icon={<AlertStatIcon />} count={data?.summary.activeEmergencyCount ?? 0} unit="건" label="긴급호출" to="/hq/sites" />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between pt-7">
          <h2 className="text-sm font-medium leading-5 text-[var(--color-text-label)]">
            현장 현황 · 위험도 순<span className="ml-2 text-xs text-[var(--color-text-faint)]">{visible.length}곳</span>
          </h2>
          <Link to="/hq/sites" className="inline-flex items-center gap-1 text-xs text-[var(--color-text-body)] transition-colors hover:text-[var(--color-text-heading)]">
            전체 관리
            <ChevronStatIcon />
          </Link>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {error ? (
            <ErrorBlock message={error} onRetry={load} />
          ) : !data ? (
            <LoadingBlock />
          ) : visible.length === 0 ? (
            <EmptyBlock>{search.trim() ? "검색 결과가 없어요." : "등록된 현장이 없어요."}</EmptyBlock>
          ) : (
            visible.map((site) => (
              <Link
                key={site.id}
                to={`/hq/sites/${encodeURIComponent(site.id)}`}
                className="flex min-h-[74px] items-center gap-4 rounded-lg border border-[var(--home-card-border)] bg-[var(--home-card-bg)] px-5 py-4 transition-colors hover:bg-[var(--color-bg-surface)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="whitespace-nowrap text-sm font-medium text-[var(--color-text-heading)]">{site.name}</p>
                    {(site.emergency || site.heatLevel === 3) && (
                      <span className="rounded border border-[var(--color-danger-border)] bg-[var(--color-danger-soft-bg)] px-1.5 py-0.5 text-[10px] text-[var(--color-danger-text)]">긴급</span>
                    )}
                  </div>
                  <p className="pt-1 text-xs text-[var(--color-text-body)]">
                    {[site.managerName, site.teamCount != null ? `팀 ${site.teamCount}개` : ""].filter(Boolean).join(" · ") || "-"}
                  </p>
                </div>
                <SiteHeatBadge temperature={site.temperature} label={heatLabel(site)} tone={heatTone(site)} />
                <div className="w-16 text-right">
                  <p className={`font-['JetBrains_Mono',monospace] text-xs ${doneClass(heatTone(site))}`}>{doneText(site.checklistDone, site.checklistTotal)}</p>
                  <p className="pt-0.5 text-[11px] text-[var(--color-text-faint)]">오늘 {site.todayRecordCount}건</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </HQContent>
    </HQLayout>
  );
}
