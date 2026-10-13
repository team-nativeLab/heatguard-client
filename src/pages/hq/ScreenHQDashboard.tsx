import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import HQLayout, { HQContent } from "../../components/hq/HQLayout";
import { SiteHeatBadge } from "../../components/hq/RecordTable";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../components/hq/LoadState";
import { hqApi, errorMessage, type HqDashboard, type HqSite } from "../../api";
import { useHqMe } from "../../hooks/useHqMe";
import { usePolling } from "../../shared/hooks/usePolling";
import { doneText, heatLabel, heatTone, sortByRisk, tempText } from "../../lib/hqFormat";
import ThemeToggleButton from "../../shared/ui/ThemeToggleButton";
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

const GLOW: Record<string, string> = {
  red: "rgba(239, 68, 68, 0.46)",
  orange: "rgba(249, 115, 22, 0.42)",
  yellow: "rgba(251, 191, 36, 0.4)",
  none: "rgba(148, 163, 184, 0.3)",
};

export default function ScreenHQDashboard() {
  const navigate = useNavigate();
  const me = useHqMe();
  const [data, setData] = useState<HqDashboard | null>(null);
  const [sites, setSites] = useState<HqSite[]>([]);
  const [error, setError] = useState("");

  // 대시보드 요약 + 위험도 순 현장 목록. 30초마다 새로 고친다.
  const load = useCallback(async () => {
    try {
      const dash = await hqApi.getDashboard();
      const list = dash.sitesByRisk.length > 0 ? dash.sitesByRisk : await hqApi.listAllSites();
      setData(dash);
      setSites(sortByRisk(list));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "대시보드를 불러오지 못했어요."));
    }
  }, []);
  usePolling(load, 30_000, 120_000);
  const [now, setNow] = useState(() => new Date());
  const [search, setSearch] = useState("");

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const dateText = `${now.getFullYear()}. ${pad(now.getMonth() + 1)}. ${pad(now.getDate())}. (${WEEKDAYS[now.getDay()]})`;
  const timeText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const top: HqSite | undefined = sites[0];
  // 가장 위험한 현장의 위험도에 맞춘 카드 글로우 색
  const glowColor = GLOW[top ? heatTone(top) : "none"];
  const weather = data?.weather;
  const topTemp = top?.temperature ?? weather?.temperature ?? null;
  const visible = sites.filter((s) => s.name.includes(search.trim()));

  return (
    <HQLayout toggleInHeader>
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
                placeholder="현장을 검색하세요..."
                className="h-full w-full bg-transparent pl-[35px] pr-2 text-[12.5px] text-[var(--color-text-heading)] outline-none placeholder:text-[var(--color-text-body)]"
              />
            </label>
            <ThemeToggleButton />
          </div>
        </header>

        <section className="mt-0.5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div
            className="relative flex min-h-[275px] flex-col overflow-hidden rounded-xl border border-[var(--home-card-border)] p-5"
            style={{ background: `linear-gradient(110deg, color-mix(in srgb, ${glowColor} 32%, var(--home-card-bg)) 0%, var(--home-card-bg) 100%)` }}
          >
            {/* 날씨 아이콘 + 글로우: 한 묶음으로 두어 블러가 항상 아이콘 정중앙에 오도록 한다 */}
            <div aria-hidden="true" className="pointer-events-none absolute right-[52px] top-[78px] z-10 w-[104px] select-none">
              <span
                className="absolute left-1/2 top-1/2 size-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`, filter: "blur(14px)" }}
              />
              <img src="/sun.png" alt="" draggable={false} className="relative h-auto w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]" />
            </div>

            <div className="relative flex items-center justify-between">
              <span className="rounded-full bg-[var(--color-danger-soft-bg)] px-2.5 py-1 text-xs font-medium leading-4 text-[var(--color-danger-text)]">
                <span className="figma-emoji">☀</span> {top ? heatLabel(top) : "현장 없음"}
              </span>
              {top && (
                <button
                  type="button"
                  onClick={() => navigate(`/hq/sites/${encodeURIComponent(top.id)}`)}
                  title="현장 상세로 이동"
                  className="flex h-[26px] items-center gap-1.5 rounded-full border border-[var(--home-pill-border)] bg-[var(--home-pill-bg)] pl-[11px] pr-2 text-xs font-medium text-[var(--home-pill-fg)] transition hover:brightness-95"
                >
                  <PinStatIcon />
                  {top.name}
                  <span className="ml-2.5">
                    <ChevronStatIcon />
                  </span>
                </button>
              )}
            </div>

            <p className="relative pt-4 text-[15px] font-medium leading-5 text-[var(--color-text-label)]">가장 높은 현장 온도</p>
            <div className="relative flex h-[82px] items-end gap-3 pt-1">
              <span className="text-[72px] font-semibold leading-[72px] tracking-[-2px] text-[var(--color-text-heading)]">{topTemp != null ? topTemp.toFixed(1) : "-"}</span>
              {topTemp != null && (
                <div className="flex items-center gap-2 pb-1.5">
                  <span className="text-[32px] font-medium leading-10 text-[var(--color-text-heading)]">°C</span>
                </div>
              )}
            </div>
            <p className="relative whitespace-pre pt-3 text-[15px] font-medium leading-5 text-[var(--color-text-label)]">
              {`습도 ${weather?.humidity != null ? `${weather.humidity}%` : "-"}  |  체감온도 ${tempText(weather?.apparentTemperature) || "-"}`}
            </p>

            <div className="relative mt-auto grid grid-cols-3 gap-3 pt-4">
              {[
                ["습도", weather?.humidity != null ? `${weather.humidity}%` : "-"],
                ["체감온도", tempText(weather?.apparentTemperature) || "-"],
                ["날씨", weather?.sky || "-"],
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
              <div className="mr-[18px] mt-[13px] flex flex-col items-start">
                <p className="whitespace-nowrap text-sm leading-5 text-[var(--color-text-body)]">{dateText}</p>
                <p className="pt-1 text-[28px] font-light leading-[34px] tracking-[-1.2px] tabular-nums text-[var(--color-text-heading)]">{timeText}</p>
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
          <Link to="/hq/sites" className="text-xs text-[var(--color-text-body)] transition-colors hover:text-[var(--color-text-heading)]">
            전체 관리 →
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
