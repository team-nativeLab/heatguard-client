import { useEffect, useMemo, useState, type ReactNode } from "react";
import PhotoLightbox from "../manager/PhotoLightbox";
import ThemeToggleButton from "../ui/ThemeToggleButton";
import { useToast } from "../ui/Toast";
import RecordThumb from "./RecordThumb";
import { useSiteMe } from "../../hooks/useSiteMe";
import { dashboardApi, recordsApi, type RecordItem } from "../../api";
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
    heatWarningLevel?: string;
    deltaFromYesterday?: number;
  };
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

export default function HomeDashboard({ onEmergencyTest }: { onEmergencyTest?: () => void }) {
  const { showToast } = useToast();
  const now = useNow();
  const me = useSiteMe();

  const [today, setToday] = useState<DashboardTodayResponse>(FALLBACK_TODAY);
  const [isLive, setIsLive] = useState(false);

  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");
  const [from, setFrom] = useState(() => toInputDate(new Date()));
  const [to, setTo] = useState(() => toInputDate(new Date()));
  const [lightbox, setLightbox] = useState<RecordItem | null>(null);

  const [queriedRecords, setQueriedRecords] = useState<RecordItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    const todayStr = toInputDate(new Date());
    const fetchToday = async () => {
      try {
        const [dash, recordsRes] = await Promise.all([
          dashboardApi.getDashboard(),
          recordsApi.listRecords({ date: todayStr }),
        ]);
        if (!alive) return;
        const records = recordsRes.items;
        setToday({
          date: todayStr,
          siteName: FALLBACK_TODAY.siteName,
          weather: {
            temperature: dash.weather.temperature,
            humidity: dash.weather.humidity,
            feelsLike: dash.weather.feelsLike,
            condition: dash.weather.condition,
            heatWarningLevel: dash.heatLevel,
          },
          stats: {
            workPhotoCount: records.filter((r) => r.type === "작업사진").length,
            restPhotoCount: records.filter((r) => r.type === "휴식사진").length,
            siteRequestCount: FALLBACK_TODAY.stats.siteRequestCount,
            dangerAlertCount: dash.summary.activeEmergencyCount,
          },
          records,
        });
        setIsLive(true);
      } catch (err) {
        if (alive && !isLive) {

          console.warn("오늘 대시보드 조회 실패 — 데모 데이터로 표시합니다.", err);
        }
      }
    };
    fetchToday();
    const id = window.setInterval(fetchToday, POLL_INTERVAL_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };

  }, []);

  const records = queriedRecords ?? today.records;
  const rows = useMemo(() => {
    const q = search.trim();
    return q ? records.filter((r) => `${r.type} ${r.place}`.includes(q)) : records;
  }, [records, search]);

  const dateText = `${now.getFullYear()}. ${pad(now.getMonth() + 1)}. ${pad(now.getDate())}. (${WEEKDAYS[now.getDay()]})`;
  const timeText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const resetQuery = () => {
    const todayStr = toInputDate(new Date());
    setFrom(todayStr);
    setTo(todayStr);
    setQueriedRecords(null);
    showToast("조회 기간을 오늘로 초기화했어요.");
  };

  const runQuery = async () => {
    if (!from || !to) return showToast("조회할 기간을 선택해주세요.", "error");
    if (from > to) return showToast("시작일이 종료일보다 늦을 수 없어요.", "error");
    try {

      const res = await recordsApi.listRecords({ date: from });
      setQueriedRecords(res.items);
      showToast(`${toDisplayDate(from)} ~ ${toDisplayDate(to)} 기록을 조회했어요.`, "success");
    } catch (err) {
      console.warn("날짜별 기록 조회 실패", err);
      showToast("기록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.", "error");
    }
  };

  const siteName = today.siteName || me.site.name;
  const w = today.weather;

  return (
    <div className="w-full flex flex-col">
      {}
      <header className="flex items-start justify-between gap-4 h-[74px]">
        <div>
          <p className="text-[13px] text-[var(--color-text-body)]">안녕하세요, {me.user.name} 님</p>
          <h1 className="font-bold text-[19px] leading-[1.4] text-[var(--color-text-heading)] whitespace-nowrap">
            오늘도 안전한 현장을 만들어가요.
          </h1>
        </div>
        <div className="flex items-center gap-3 pt-0.5">
          <label className="relative flex items-center w-[260px] h-[38px] rounded-[10px] bg-[var(--home-search-bg)] border border-[var(--home-search-border)] focus-within:border-[var(--color-accent)] transition-colors">
            <SearchIcon className="absolute left-3 size-[15px] text-[var(--color-text-body)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="현장, 기록, 작업자를 검색하세요..."
              className="w-full h-full bg-transparent pl-[35px] pr-2 text-[12.5px] text-[var(--color-text-heading)] placeholder:text-[var(--color-text-body)] outline-none"
            />
          </label>
          {}
          <ThemeToggleButton />
        </div>
      </header>

      {}
      <section className="grid grid-cols-2 gap-4 mt-0.5">
        {}
        <div
          className="relative overflow-hidden rounded-xl border border-[var(--home-card-border)] p-5 min-h-[275px] flex flex-col"
          style={{ background: "var(--home-card-warm-bg)" }}
        >
          <span
            aria-hidden="true"
            className="absolute right-[42px] top-[66px] size-[112px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, var(--home-glow) 0%, transparent 68%)", filter: "blur(5px)" }}
          />
          <div className="relative flex items-center justify-between">
            {w.heatWarningLevel ? (
              <span className="bg-[var(--color-heat-badge-bg)] text-[#ff6800] text-xs font-medium leading-4 px-2.5 py-1 rounded-full">
                <span className="figma-emoji">☀</span> {w.heatWarningLevel}
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => showToast(`현재 현장: ${siteName}`)}
              className="flex items-center gap-1.5 h-[26px] pl-[11px] pr-2 rounded-full bg-[var(--home-pill-bg)] text-[var(--home-pill-fg)] text-xs font-medium hover:brightness-95 transition"
            >
              <MapPinIcon className="size-3" />
              {siteName}
              <ChevronRightIcon className="size-[11px] ml-2.5" />
            </button>
          </div>

          <p className="relative text-[12px] leading-4 text-[var(--color-text-body)] pt-4">현재 온도</p>
          <div className="relative flex items-end gap-3 pt-1 h-[64px]">
            <span className="font-light text-[60px] leading-[60px] tracking-[-1.5px] text-[var(--color-text-heading)]">
              {w.temperature.toFixed(1)}
            </span>
            <div className="flex items-center gap-2 pb-1.5">
              <span className="font-light text-2xl leading-8 text-[var(--color-text-heading)]">°C</span>
              {w.deltaFromYesterday != null && (
                <span className="font-['JetBrains_Mono',monospace] text-xs leading-4 px-1.5 py-[2px] rounded bg-[var(--color-delta-bg)] text-[var(--color-delta-fg)]">
                  {w.deltaFromYesterday > 0 ? "+" : ""}
                  {w.deltaFromYesterday.toFixed(1)}°C
                </span>
              )}
            </div>
          </div>
          <p className="relative text-[12px] leading-4 pt-2 text-[var(--color-text-body)] whitespace-pre">
            {`습도 ${w.humidity}%  |  체감온도 ${w.feelsLike.toFixed(1)}°C`}
          </p>

          <div className="relative grid grid-cols-3 gap-3 mt-auto pt-4">
            {[
              ["습도", `${w.humidity}%`],
              ["체감온도", `${w.feelsLike.toFixed(1)}°C`],
              ["날씨", w.condition],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--home-mini-tile-bg)] rounded-lg px-3 py-2">
                <p className="text-[10px] leading-[15px] text-[var(--color-text-body)]">{label}</p>
                <p className="font-['JetBrains_Mono',monospace] text-xs leading-4 pt-0.5 text-[var(--color-text-value)]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {}
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
          <div className="grid grid-cols-4 gap-3 mt-auto pt-6 pb-2">
            <StatTile tone="blue" icon={<CameraIcon className="size-6" />} count={today.stats.workPhotoCount} label="작업 사진" />
            <StatTile tone="green" icon={<CoffeeIcon className="size-6" />} count={today.stats.restPhotoCount} label="휴식 사진" />
            <StatTile tone="purple" icon={<ClipboardCheckIcon className="size-6" />} count={today.stats.siteRequestCount} label="현장 요청" />
            <StatTile
              tone="red"
              icon={<TriangleAlertIcon className="size-6" />}
              count={today.stats.dangerAlertCount}
              label="위험 알림"
              onClick={onEmergencyTest}
            />
          </div>
        </div>
      </section>

      {}
      <div className="flex items-center justify-between pt-7">
        <h2 className="text-sm font-medium leading-5 text-[var(--color-text-label)]">
          {queriedRecords ? `${toDisplayDate(from)} 기록` : "오늘의 기록"}
        </h2>
        <label className="relative flex items-center h-6 rounded border border-[var(--home-btn-border)] text-[10px] text-[var(--color-text-body)]">
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            aria-label="현장 필터"
            className="appearance-none bg-transparent h-full pl-2.5 pr-6 outline-none cursor-pointer"
            style={{ WebkitAppearance: "none", MozAppearance: "none" }}
          >
            <option value="all">전체 현장</option>
            <option value="site1">{siteName}</option>
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
                  검색 결과가 없어요.
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
                <td className="font-['JetBrains_Mono',monospace] text-xs text-[var(--home-table-time)]">{r.time}</td>
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

      {}
      <section className="pt-8 pb-2">
        <h2 className="text-sm font-medium leading-5 text-[var(--color-text-label)]">기록 조회</h2>
        <div className="flex items-center gap-3 pt-4 flex-wrap">
          <div className="flex items-center h-[37px] rounded-[14px] bg-[var(--home-date-pill-bg)] border border-[var(--home-card-border)] pl-5 pr-4">
            <CalendarIcon className="size-[15px] text-[var(--color-text-body)]" />
            <span className="ml-[9px]">
              <DateField value={from} onChange={setFrom} label="조회 시작일" />
            </span>
            <span className="mx-[26px] text-sm text-[var(--home-date-sub)]">~</span>
            <DateField value={to} onChange={setTo} label="조회 종료일" />
            <ChevronDownIcon className="size-4 ml-[26px] text-[var(--home-date-sub)]" />
          </div>
          <div className="flex items-center gap-3 ml-auto mr-9">
            <button
              type="button"
              onClick={runQuery}
              className="flex items-center gap-2 h-9 px-4 rounded bg-[var(--home-btn-primary-bg)] text-white text-sm hover:brightness-110 transition"
            >
              <SearchIcon className="size-3" />
              조회
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
              onClick={() => window.open(`/manager/print?date=${from}`, "_blank", "noopener,noreferrer")}
              className="h-[38px] px-3.5 rounded border border-[var(--home-btn-border)] text-sm text-[var(--color-text-body)] hover:brightness-95 transition"
            >
              인쇄
            </button>
          </div>
        </div>
      </section>

      {lightbox && (
        <PhotoLightbox
          takenAt={`${today.date} ${lightbox.time}`}
          siteName={`${siteName} · ${lightbox.place}`}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
