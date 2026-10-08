import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePolling } from "../../shared/hooks/usePolling";
import { Skeleton, SkeletonTable } from "../../shared/ui/Skeleton";
import { useNavigate } from "react-router-dom";
import PhotoLightbox from "../../shared/ui/PhotoLightbox";
import ThemeToggleButton from "../../shared/ui/ThemeToggleButton";
import { useToast } from "../../shared/ui/Toast";
import RecordThumb from "./RecordThumb";
import { useEmergency } from "./EmergencyWatcher";
import { useSiteMe } from "../../hooks/useSiteMe";
import { dashboardApi, recordsApi, isNetworkError, isDemoFallback, type RecordItem } from "../../api";
import {
  CalendarIcon,
  CameraIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  CoffeeIcon,
  MapPinIcon,
  MoreIcon,
  SearchIcon,
  ThermometerIcon,
  TriangleAlertIcon,
} from "./HomeIcons";

interface DashboardTodayResponse {
  date: string;
  siteName: string;
  weather: {
    temperature: number;
    humidity: number;
    feelsLike: number;
    condition?: string;
    skyStatus?: string | null;
    heatWarningLevel?: string;
    deltaFromYesterday?: number;
  } | null;
  stats: { workPhotoCount: number; restPhotoCount: number; siteRequestCount: number; dangerAlertCount: number };
  records: RecordItem[];
}

const FALLBACK_TODAY: DashboardTodayResponse = {
  date: new Date().toISOString().slice(0, 10),
  siteName: "인천 복합물류센터",
  weather: {
    temperature: 36.2,
    humidity: 65,
    feelsLike: 36.2,
    condition: "맑음",
    heatWarningLevel: "폭염 경보",
    deltaFromYesterday: 1.2,
  },
  stats: { workPhotoCount: 16, restPhotoCount: 8, siteRequestCount: 2, dangerAlertCount: 1 },
  records: [
    { id: "r1", type: "온도계", place: "3층 외벽", temperature: 36, humidity: 65, apparentTemperature: 36.2, time: "09:02" },
    { id: "r2", type: "작업사진", place: "지하 배관", temperature: 34, humidity: 72, apparentTemperature: 34.5, time: "10:30" },
    { id: "r3", type: "휴식사진", place: "옥상 그늘막", temperature: 38, humidity: 80, apparentTemperature: 38.7, time: "12:05" },
    { id: "r4", type: "온도계", place: "3층 외벽", temperature: 35, humidity: 60, apparentTemperature: 35.1, time: "14:00" },
  ],
};

const TYPE_ICON: Record<RecordItem["type"], ReactNode> = {
  온도계: <ThermometerIcon className="size-[13px] text-[var(--home-stat-red-fg)]" />,
  작업사진: <CameraIcon className="size-[13px] text-[var(--home-stat-blue-fg)]" />,
  휴식사진: <CoffeeIcon className="size-[13px] text-[var(--home-stat-green-fg)]" />,
};

function feelsLikeColor(temp: number) {
  if (temp >= 38) return "#dc2626";
  if (temp >= 35) return "#ea580c";
  if (temp >= 33) return "#d97706";
  return "var(--color-text-value)";
}

function weatherGlowColor(weather: DashboardTodayResponse["weather"], hour: number) {
  if (!weather) return "rgba(148, 163, 184, 0.3)";
  const condition = `${weather.condition === "-" ? "" : weather.condition ?? ""} ${weather.skyStatus ?? ""}`.toLowerCase();
  const isNight = hour < 6 || hour >= 19;

  if (/thunder|storm|뇌우|천둥|번개/.test(condition)) return "rgba(167, 139, 250, 0.48)";
  if (/rain|shower|비|소나기/.test(condition)) return "rgba(56, 189, 248, 0.46)";
  if (/snow|눈|진눈깨비/.test(condition)) return "rgba(125, 211, 252, 0.5)";
  if (/fog|mist|안개/.test(condition)) return "rgba(203, 213, 225, 0.45)";
  if (/haze|dust|smog|황사|미세먼지|연무/.test(condition)) return "rgba(250, 204, 21, 0.42)";
  if (/wind|바람/.test(condition)) return "rgba(45, 212, 191, 0.42)";
  if (/rainbow|무지개/.test(condition)) return "rgba(244, 114, 182, 0.42)";
  if (/partly|mostly|구름많|구름 조금|구름조금/.test(condition)) {
    if (isNight) return "rgba(129, 140, 248, 0.4)";
    return weather.temperature >= 30 ? "rgba(251, 146, 60, 0.42)" : "rgba(96, 165, 250, 0.38)";
  }
  if (/overcast|흐림|cloud|구름/.test(condition)) {
    return weather.temperature >= 30 ? "rgba(251, 146, 60, 0.38)" : "rgba(148, 163, 184, 0.4)";
  }
  if (isNight) return "rgba(129, 140, 248, 0.4)";
  if (weather.temperature >= 38) return "rgba(239, 68, 68, 0.46)";
  if (weather.temperature >= 33) return "rgba(249, 115, 22, 0.44)";
  if (weather.temperature >= 25 || /clear|sun|맑음/.test(condition)) return "rgba(251, 146, 60, 0.42)";
  if (weather.temperature <= 5) return "rgba(125, 211, 252, 0.42)";
  return "rgba(129, 140, 248, 0.36)";
}

function weatherConditionLabel(condition?: string, skyStatus?: string | null) {
  if (condition) return condition;
  const labels: Record<string, string> = {
    CLEAR: "맑음",
    PARTLY_CLOUDY: "구름 많음",
    CLOUDY: "흐림",
    RAIN: "비",
    SNOW: "눈",
  };
  return skyStatus ? labels[skyStatus.toUpperCase()] ?? skyStatus : "-";
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

const toInputDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDisplayDate = (v: string) => (v ? v.replaceAll("-", ". ") + "." : "—");

const MAX_QUERY_DAYS = 31;

/** from~to(포함) 날짜 목록. 범위가 너무 길면 null */
function dateRange(from: string, to: string): string[] | null {
  const out: string[] = [];
  const cur = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cur <= end) {
    out.push(toInputDate(cur));
    if (out.length > MAX_QUERY_DAYS) return null;
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

type QueriedRecord = RecordItem & { date: string };

function DateField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="relative cursor-pointer text-[13px] text-[var(--home-date-fg)] whitespace-nowrap">
      {toDisplayDate(value)}
      <input
        type="date"
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        className="absolute inset-0 opacity-0 cursor-pointer [color-scheme:var(--native-color-scheme)]"
        style={{ WebkitAppearance: "none" }}
      />
    </label>
  );
}

const TONE_CLASS = {
  blue: "bg-[var(--home-stat-blue-bg)] text-[var(--home-stat-blue-fg)]",
  green: "bg-[var(--home-stat-green-bg)] text-[var(--home-stat-green-fg)]",
  purple: "bg-[var(--home-stat-purple-bg)] text-[var(--home-stat-purple-fg)]",
  red: "bg-[var(--home-stat-red-bg)] text-[var(--home-stat-red-fg)]",
} as const;

function StatTile({
  icon,
  count,
  label,
  tone,
  onClick,
}: {
  icon: ReactNode;
  count: number;
  label: string;
  tone: "blue" | "green" | "purple" | "red";
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={`flex flex-col items-center h-[132px] pt-[26px] rounded-[10px] ${TONE_CLASS[tone]} ${
        onClick ? "hover:brightness-[0.97] transition cursor-pointer" : ""
      }`}
    >
      <span className="size-6">{icon}</span>
      <p
        className={`mt-[15px] font-semibold text-[30px] leading-[30px] ${
          tone === "red" ? "text-[var(--home-stat-red-fg)]" : "text-[var(--color-text-heading)]"
        }`}
      >
        {count}
        <span className="text-base font-normal leading-6 ml-0.5">건</span>
      </p>
      <p className="mt-auto pb-2.5 text-[11px] leading-[16.5px] text-[var(--color-text-body)]">{label}</p>
    </Tag>
  );
}

const POLL_INTERVAL_MS = 8000;

export default function HomeDashboard() {
  const { showToast } = useToast();
  const { openTest } = useEmergency();
  const navigate = useNavigate();
  const now = useNow();
  const me = useSiteMe();

  // null = 아직 불러오는 중 (가짜 데이터를 먼저 보여주지 않는다)
  const [today, setToday] = useState<DashboardTodayResponse | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [from, setFrom] = useState(() => toInputDate(new Date()));
  const [to, setTo] = useState(() => toInputDate(new Date()));
  const [lightbox, setLightbox] = useState<QueriedRecord | null>(null);

  const [queriedRecords, setQueriedRecords] = useState<QueriedRecord[] | null>(null);
  const [querying, setQuerying] = useState(false);

  // 탭이 가려져 있으면 새로고침을 멈추고, 다시 보이면 바로 갱신한다.
  usePolling(
    async () => {
      const todayStr = toInputDate(new Date());
      try {
        const [dash, recordsRes] = await Promise.all([
          dashboardApi.getDashboard(),
          recordsApi.listRecords({ date: todayStr }),
        ]);
        const records = recordsRes.items;
        setLoadFailed(false);
        setToday({
          date: todayStr,
          siteName: "",
          weather: dash.weather
            ? {
                temperature: dash.weather.temperature,
                humidity: dash.weather.humidity,
                feelsLike:
                  dash.weather.feelsLike ??
                  dash.weather.apparentTemperature ??
                  dash.weather.temperature,
                condition: dash.weather.condition ?? weatherConditionLabel(undefined, dash.weather.skyStatus),
                skyStatus: dash.weather.skyStatus,
                heatWarningLevel: dash.heatLevel,
                deltaFromYesterday: dash.weather.deltaFromYesterday,
              }
            : null,
          stats: {
            workPhotoCount: dash.summary.workPhotoCount ?? records.filter((r) => r.type === "작업사진").length,
            restPhotoCount: dash.summary.restPhotoCount ?? records.filter((r) => r.type === "휴식사진").length,
            siteRequestCount: dash.summary.siteRequestCount ?? 0,
            dangerAlertCount: dash.summary.activeEmergencyCount,
          },
          records,
        });
      } catch (err) {
        if (isDemoFallback(err)) {
          // 데모 모드: 서버가 없으면 데모 데이터로 채운다.
          setToday((prev) => prev ?? FALLBACK_TODAY);
          return;
        }
        // 이미 받은 데이터가 있으면 유지하고 다음 주기에 다시 시도한다.
        setLoadFailed(true);
      }
    },
    POLL_INTERVAL_MS,
    null,
  );

  const records: QueriedRecord[] = useMemo(
    () => queriedRecords ?? (today ? today.records.map((r) => ({ ...r, date: today.date })) : []),
    [queriedRecords, today],
  );
  const teamOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.teamName).filter((n): n is string => !!n))),
    [records],
  );
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (teamFilter !== "all" && r.teamName !== teamFilter) return false;
      if (!q) return true;
      return `${r.type} ${r.place} ${r.teamName ?? ""} ${r.time}`.toLowerCase().includes(q);
    });
  }, [records, search, teamFilter]);
  const isRange = !!queriedRecords && from !== to;

  const dateText = `${now.getFullYear()}. ${pad(now.getMonth() + 1)}. ${pad(now.getDate())}. (${WEEKDAYS[now.getDay()]})`;
  const timeText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const resetQuery = () => {
    const todayStr = toInputDate(new Date());
    setFrom(todayStr);
    setTo(todayStr);
    setQueriedRecords(null);
    setTeamFilter("all");
    setSearch("");
    showToast("조회 조건을 초기화했어요.");
  };

  const runQuery = async () => {
    if (querying) return;
    if (!from || !to) return showToast("조회할 기간을 선택해주세요.", "error");
    if (from > to) return showToast("시작일이 종료일보다 늦을 수 없어요.", "error");
    if (to > toInputDate(new Date())) return showToast("미래 날짜는 조회할 수 없어요.", "error");
    const dates = dateRange(from, to);
    if (!dates) return showToast(`한 번에 최대 ${MAX_QUERY_DAYS}일까지 조회할 수 있어요.`, "error");

    setQuerying(true);
    try {
      const pages = await Promise.all(
        dates.map(async (date) => {
          const items: QueriedRecord[] = [];
          let cursor: string | undefined;
          do {
            const res = await recordsApi.listRecords({ date, cursor });
            items.push(...res.items.map((r) => ({ ...r, date })));
            cursor = res.page.nextCursor ?? undefined;
          } while (cursor);
          return items;
        }),
      );
      const merged = pages.flat();
      setQueriedRecords(merged);
      setTeamFilter("all");
      showToast(
        merged.length
          ? `${toDisplayDate(from)}${from !== to ? ` ~ ${toDisplayDate(to)}` : ""} 기록 ${merged.length}건을 불러왔어요.`
          : "해당 기간의 기록이 없어요.",
        merged.length ? "success" : "default",
      );
    } catch (err) {
      showToast(
        isNetworkError(err) ? "서버에 연결할 수 없어 기록을 조회하지 못했어요." : "기록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
        "error",
      );
    } finally {
      setQuerying(false);
    }
  };

  const openPrint = () => {
    if (from > to) return showToast("시작일이 종료일보다 늦을 수 없어요.", "error");
    window.open(`/manager/print?date=${from}`, "_blank", "noopener,noreferrer");
  };

  const header = (
      <header className="flex flex-wrap items-start justify-between gap-4 min-h-[74px]">
        <div>
          <p className="text-[13px] text-[var(--color-text-body)]">안녕하세요, {me.user.name} 님</p>
          <h1 className="font-bold text-[19px] leading-[1.4] text-[var(--color-text-heading)] whitespace-nowrap">
            오늘도 안전한 현장을 만들어가요.
          </h1>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3 pt-0.5">
          <label className="relative flex items-center w-full sm:w-[260px] h-[38px] rounded-[10px] bg-[var(--home-search-bg)] border border-[var(--home-search-border)] focus-within:border-[var(--color-accent)] transition-colors">
            <SearchIcon className="absolute left-3 size-[15px] text-[var(--color-text-body)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="현장, 기록, 작업자를 검색하세요..."
              className="w-full h-full bg-transparent pl-[35px] pr-2 text-[12.5px] text-[var(--color-text-heading)] placeholder:text-[var(--color-text-body)] outline-none"
            />
          </label>
          <span className="hidden md:inline-flex">
            <ThemeToggleButton />
          </span>
        </div>
      </header>
  );

  if (!today) {
    return (
      <div className="w-full flex flex-col">
        {header}
        {loadFailed ? (
          <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--home-card-bg)] px-6 py-12 text-center">
            <p className="text-sm text-[var(--color-text-heading)]">대시보드를 불러오지 못했어요.</p>
            <p className="pt-1 text-xs text-[var(--color-text-body)]">잠시 후 자동으로 다시 시도해요.</p>
          </div>
        ) : (
          <div role="status" aria-label="불러오는 중" className="flex flex-col gap-4 mt-0.5">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Skeleton className="h-[275px] rounded-xl" />
              <Skeleton className="h-[275px] rounded-xl" />
            </div>
            <Skeleton className="h-4 w-24 mt-4" />
            <SkeletonTable rows={4} />
          </div>
        )}
      </div>
    );
  }

  const siteName = today.siteName || me.site.name;
  const w = today.weather;
  const glowColor = weatherGlowColor(w, now.getHours());

  return (
    <div className="w-full flex flex-col">
      {header}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-0.5">
        <div
          className="relative overflow-hidden rounded-xl border border-[var(--home-card-border)] p-5 min-h-[275px] flex flex-col"
          style={{
            background: `linear-gradient(110deg, color-mix(in srgb, ${glowColor} 32%, var(--home-card-bg)) 0%, var(--home-card-bg) 100%)`,
          }}
        >
          {/* 날씨 아이콘 + 글로우: 한 묶음으로 두어 블러가 항상 아이콘 정중앙에 오도록 한다 */}
          <div aria-hidden="true" className="pointer-events-none absolute right-[52px] top-[78px] z-10 w-[104px] select-none">
            <span
              className="absolute left-1/2 top-1/2 size-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`, filter: "blur(14px)" }}
            />
            <img
              src="/sun.png"
              alt=""
              draggable={false}
              className="relative h-auto w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
            />
          </div>
          <div className="relative flex items-center justify-between">
            {w?.heatWarningLevel ? (
              <span className="bg-[var(--color-heat-badge-bg)] text-[#ff6800] text-xs font-medium leading-4 px-2.5 py-1 rounded-full">
                <span className="figma-emoji">☀</span> {w.heatWarningLevel}
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => navigate("/manager/sites")}
              title="현장 관리로 이동"
              className="flex items-center gap-1.5 h-[26px] pl-[11px] pr-2 rounded-full bg-[var(--home-pill-bg)] border border-[var(--home-pill-border)] text-[var(--home-pill-fg)] text-xs font-medium hover:brightness-95 transition"
            >
              <MapPinIcon className="size-3" />
              {siteName}
              <ChevronRightIcon className="size-[11px] ml-2.5" />
            </button>
          </div>

          <p className="relative text-[12px] leading-4 text-[var(--color-text-body)] pt-4">현재 온도</p>
          <div className="relative flex items-end gap-3 pt-1 h-[64px]">
            <span className="font-light text-[60px] leading-[60px] tracking-[-1.5px] text-[var(--color-text-heading)]">
              {w ? w.temperature.toFixed(1) : "—"}
            </span>
            <div className="flex items-center gap-2 pb-1.5">
              <span className="font-light text-2xl leading-8 text-[var(--color-text-heading)]">°C</span>
              {w && w.deltaFromYesterday != null && (
                <span className="font-['JetBrains_Mono',monospace] text-xs leading-4 px-1.5 py-[2px] rounded bg-[var(--color-delta-bg)] text-[var(--color-delta-fg)]">
                  {w.deltaFromYesterday > 0 ? "+" : ""}
                  {w.deltaFromYesterday.toFixed(1)}°C
                </span>
              )}
            </div>
          </div>
          <p className="relative text-[12px] leading-4 pt-2 text-[var(--color-text-body)] whitespace-pre">
            {w ? `습도 ${w.humidity}%  |  체감온도 ${w.feelsLike.toFixed(1)}°C` : "기상 기준값 미입력"}
          </p>

          <div className="relative grid grid-cols-3 gap-3 mt-auto pt-4">
            {[
              ["습도", w ? `${w.humidity}%` : "—"],
              ["체감온도", w ? `${w.feelsLike.toFixed(1)}°C` : "—"],
              ["날씨", w ? weatherConditionLabel(w.condition, w.skyStatus) : "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-[var(--home-weather-tile-bg)] border border-[var(--home-weather-tile-border)] backdrop-blur-[2px] rounded-lg px-3 py-2"
              >
                <p className="text-[10px] leading-[15px] text-[var(--color-text-body)]">{label}</p>
                <p className="font-['JetBrains_Mono',monospace] text-xs leading-4 pt-0.5 text-[var(--color-text-value)]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--home-card-border)] bg-[var(--home-card-bg)] p-5 min-h-[275px] flex flex-col">
          <div className="flex items-start justify-between">
            <h2 className="text-sm font-medium leading-5 text-[var(--color-text-label)]">오늘의 현황</h2>
            <div className="flex flex-col items-start mt-[13px] mr-[18px]">
              <p className="text-sm leading-5 text-[var(--color-text-body)] whitespace-nowrap">{dateText}</p>
              <p className="font-light text-[28px] leading-[34px] pt-1 tracking-[-1.2px] text-[var(--color-text-heading)] tabular-nums">
                {timeText}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-auto pt-6 pb-2">
            <StatTile tone="blue" icon={<CameraIcon className="size-6" />} count={today.stats.workPhotoCount} label="작업 사진" />
            <StatTile tone="green" icon={<CoffeeIcon className="size-6" />} count={today.stats.restPhotoCount} label="휴식 사진" />
            <StatTile tone="purple" icon={<ClipboardCheckIcon className="size-6" />} count={today.stats.siteRequestCount} label="현장 요청" />
            <StatTile
              tone="red"
              icon={<TriangleAlertIcon className="size-6" />}
              count={today.stats.dangerAlertCount}
              label="위험 알림"
              onClick={openTest}
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between pt-7">
        <h2 className="text-sm font-medium leading-5 text-[var(--color-text-label)]">
          {queriedRecords
            ? `${toDisplayDate(from)}${isRange ? ` ~ ${toDisplayDate(to)}` : ""} 기록`
            : "오늘의 기록"}
          <span className="ml-2 text-xs text-[var(--color-text-faint)]">{rows.length}건</span>
        </h2>
        <label className="relative flex items-center h-6 rounded border border-[var(--home-btn-border)] text-[10px] text-[var(--color-text-body)]">
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            aria-label="팀 필터"
            className="appearance-none bg-[var(--home-main-bg)] h-full pl-2.5 pr-6 outline-none cursor-pointer rounded"
            style={{ WebkitAppearance: "none", MozAppearance: "none" }}
          >
            <option value="all">전체 팀</option>
            {teamOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-2 size-[11px] pointer-events-none" />
        </label>
      </div>

      <div className="mt-3 bg-[var(--home-table-bg)] border border-[var(--home-card-border)] rounded-lg overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
          <colgroup>
            <col style={{ width: "19.3%" }} />
            <col style={{ width: "16.8%" }} />
            <col style={{ width: "17.3%" }} />
            <col style={{ width: "10.3%" }} />
            <col style={{ width: "10.3%" }} />
            <col style={{ width: "14.5%" }} />
            <col style={{ width: "6.8%" }} />
            <col style={{ width: "4.7%" }} />
          </colgroup>
          <thead>
            <tr className="border-[var(--home-table-border)] border-b font-['JetBrains_Mono',monospace] text-[10px] font-bold tracking-[0.5px] text-[var(--home-table-head)] h-[35.5px]">
              <th className="pl-4 font-bold">사진</th>
              <th className="pl-[19px] font-bold">유형</th>
              <th className="font-bold">장소</th>
              <th className="font-bold">온도</th>
              <th className="font-bold">습도</th>
              <th className="font-bold">체감온도</th>
              <th className="font-bold">시간</th>
              <th className="text-[var(--home-table-more)]">
                <MoreIcon className="size-5 -ml-0.5" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="h-[60px] text-center text-xs text-[var(--color-text-body)]">
                  {search.trim() || teamFilter !== "all" ? "검색 결과가 없어요." : "기록이 없어요."}
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-[var(--home-table-border)] border-b last:border-b-0 h-10">
                <td className="pl-4">
                  <RecordThumb src={r.photoUrl ?? undefined} onClick={() => setLightbox(r)} />
                </td>
                <td className="text-xs text-[var(--home-table-text)]">
                  <span className="flex items-center gap-1.5">
                    {TYPE_ICON[r.type]}
                    {r.type}
                  </span>
                </td>
                <td className="text-xs text-[var(--home-table-text)]">{r.place}</td>
                <td className="font-['JetBrains_Mono',monospace] text-xs text-[var(--home-table-value)]">{r.temperature}°</td>
                <td className="font-['JetBrains_Mono',monospace] text-xs text-[var(--home-table-value)]">{r.humidity}%</td>
                <td
                  className="font-['JetBrains_Mono',monospace] text-xs font-medium"
                  style={{ color: feelsLikeColor(r.apparentTemperature ?? 0) }}
                >
                  {(r.apparentTemperature ?? 0).toFixed(1)}°C
                </td>
                <td className="font-['JetBrains_Mono',monospace] text-xs text-[var(--home-table-time)] whitespace-nowrap">
                  {isRange && <span className="text-[var(--color-text-faint)] mr-1">{r.date.slice(5).replace("-", "/")}</span>}
                  {r.time}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => setLightbox(r)}
                    aria-label="기록 상세"
                    className="text-[var(--home-table-more)] hover:text-[var(--color-text-label)] transition-colors"
                  >
                    <MoreIcon className="size-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="pt-8 pb-2">
        <h2 className="text-sm font-medium leading-5 text-[var(--color-text-label)]">기록 조회</h2>
        <div className="flex items-center gap-3 pt-4 flex-wrap">
          <div className="flex items-center h-[37px] rounded-[14px] bg-[var(--home-date-pill-bg)] border border-[var(--home-card-border)] pl-5 pr-4">
            <CalendarIcon className="size-[15px] text-[var(--color-text-body)]" />
            <span className="ml-[9px]">
              <DateField value={from} onChange={setFrom} label="조회 시작일" />
            </span>
            <span className="mx-3 sm:mx-[26px] text-sm text-[var(--home-date-sub)]">~</span>
            <DateField value={to} onChange={setTo} label="조회 종료일" />
            <ChevronDownIcon className="size-4 ml-3 sm:ml-[26px] text-[var(--home-date-sub)]" />
          </div>
          <div className="flex items-center gap-3 sm:ml-auto sm:mr-9">
            <button
              type="button"
              onClick={runQuery}
              disabled={querying}
              className="flex items-center gap-2 h-9 px-4 rounded bg-[var(--home-btn-primary-bg)] text-white text-sm hover:brightness-110 transition disabled:opacity-60"
            >
              <SearchIcon className="size-3" />
              {querying ? "조회 중..." : "조회"}
            </button>
            <button
              type="button"
              onClick={resetQuery}
              className="h-[38px] px-3.5 rounded border border-[var(--home-btn-border)] text-sm text-[var(--color-text-body)] hover:brightness-95 transition"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={openPrint}
              title="시작일 기준 하루치 기록을 인쇄해요"
              className="h-[38px] px-3.5 rounded border border-[var(--home-btn-border)] text-sm text-[var(--color-text-body)] hover:brightness-95 transition"
            >
              인쇄
            </button>
          </div>
        </div>
      </section>

      {lightbox && (
        <PhotoLightbox
          photoUrl={lightbox.photoUrl}
          takenAt={`${lightbox.date.replaceAll("-", ".")} ${lightbox.time}`}
          siteName={`${siteName} · ${lightbox.place}`}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
