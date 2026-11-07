import { useEffect, useState } from "react";
import { ApiError, errorMessage, hqApi, type HqSiteWeather } from "../../api";

const inputClass = "h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)]";

function statusText(weather: HqSiteWeather) {
  if (weather.availability === "LOCATION_REQUIRED" || weather.errorCode === "WEATHER_LOCATION_REQUIRED") return "현장 위치를 등록해야 날씨를 조회할 수 있어요.";
  if (weather.availability === "UNAVAILABLE") return "현재 날씨를 불러올 수 없어요.";
  if (weather.availability === "CACHED" || weather.isStale) return "이전 관측값을 표시하고 있어요.";
  if (weather.availability === "AVAILABLE") return "기상청 최신 관측값";
  return "날씨 상태를 확인할 수 없어요.";
}

export default function SiteWeatherPanel({ siteId, version, active }: { siteId: string; version: number; active: boolean }) {
  const [weather, setWeather] = useState<HqSiteWeather | null>(null);
  const [nx, setNx] = useState("");
  const [ny, setNy] = useState("");
  const [mode, setMode] = useState("AUTO");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const value = await hqApi.getSiteWeather(siteId);
      setWeather(value);
      setNx(value.weatherLocation?.nx == null ? "" : String(value.weatherLocation.nx));
      setNy(value.weatherLocation?.ny == null ? "" : String(value.weatherLocation.ny));
      setMode(value.weatherMode || "AUTO");
    } catch (err) {
      setError(errorMessage(err, "현장 날씨를 불러오지 못했어요."));
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [siteId]);

  const save = async () => {
    const x = Number(nx), y = Number(ny);
    if (!Number.isInteger(x) || !Number.isInteger(y) || x <= 0 || y <= 0) {
      setError("기상청 격자 좌표 nx, ny를 입력해주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await hqApi.updateSiteWeatherLocation(siteId, { version, weatherMode: mode, weatherLocation: { nx: x, ny: y } });
      await load();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? "현장 정보가 바뀌었거나 비활성 상태예요. 새로고침 후 다시 확인해주세요." : errorMessage(err, "위치 설정을 저장하지 못했어요."));
    } finally { setSaving(false); }
  };

  return <section className="mt-6 rounded-xl border border-[var(--home-card-border)] bg-[var(--home-card-bg)] p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-base font-semibold text-[var(--color-text-heading)]">현장 날씨</h2>
      <p className="mt-1 text-xs text-[var(--color-text-body)]">{loading ? "불러오는 중…" : weather ? statusText(weather) : "날씨 상태를 확인할 수 없어요."}</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs disabled:opacity-50">새로고침</button>
    </div>
    {weather && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[["온도", weather.temperature == null ? "—" : `${weather.temperature}°C`], ["습도", weather.humidity == null ? "—" : `${weather.humidity}%`], ["체감온도", weather.apparentTemperature == null ? "—" : `${weather.apparentTemperature}°C`], ["날씨", weather.skyStatus || "—"]].map(([label,value])=><div key={label} className="rounded-lg bg-[var(--color-bg-surface)] p-3"><p className="text-xs text-[var(--color-text-body)]">{label}</p><p className="mt-1 text-sm font-medium text-[var(--color-text-heading)]">{value}</p></div>)}
    </div>}
    {weather?.observedAt && <p className="mt-3 text-xs text-[var(--color-text-faint)]">관측 시각: {new Date(weather.observedAt).toLocaleString("ko-KR")}</p>}
    <div className="mt-5 border-t border-[var(--color-border)] pt-4">
      <h3 className="text-sm font-medium text-[var(--color-text-heading)]">기상청 위치 설정</h3>
      <p className="mt-1 text-xs text-[var(--color-text-body)]">현장 위치의 기상청 격자 좌표를 입력하세요. 기기 위치를 사용하지 않습니다.</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-xs text-[var(--color-text-body)]">날씨 모드<select className={`${inputClass} mt-1 w-full`} value={mode} onChange={e=>setMode(e.target.value)}><option value="AUTO">자동 조회</option><option value="MANUAL">수동 입력</option></select></label>
        <label className="text-xs text-[var(--color-text-body)]">격자 nx<input className={`${inputClass} mt-1 w-full`} type="number" inputMode="numeric" value={nx} onChange={e=>setNx(e.target.value)} /></label>
        <label className="text-xs text-[var(--color-text-body)]">격자 ny<input className={`${inputClass} mt-1 w-full`} type="number" inputMode="numeric" value={ny} onChange={e=>setNy(e.target.value)} /></label>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-[var(--color-danger-text)]">{error}</p>}
      <button type="button" disabled={!active || saving || loading} onClick={()=>void save()} className="mt-3 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "저장 중…" : "위치 저장"}</button>
    </div>
  </section>;
}
