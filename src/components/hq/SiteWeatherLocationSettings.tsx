import { useCallback, useEffect, useState } from "react";
import { errorMessage, hqApi } from "../../api";
import type { HqSiteWeatherSettings } from "../../api/hq";
import { useToast } from "../../shared/ui/Toast";

const fieldClass = "h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-app)] px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)]";

export default function SiteWeatherLocationSettings({
  siteId,
  onSaved,
}: {
  siteId: string;
  onSaved: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<HqSiteWeatherSettings | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await hqApi.getSiteWeather(siteId);
      setSettings(result);
      setLatitude(result.weatherLocation?.latitude == null ? "" : String(result.weatherLocation.latitude));
      setLongitude(result.weatherLocation?.longitude == null ? "" : String(result.weatherLocation.longitude));
      if (!result.version) setError("날씨 설정 버전을 확인할 수 없습니다. 현장 정보를 다시 조회해 주세요.");
    } catch (err) {
      setError(errorMessage(err, "현장 날씨 설정을 불러오지 못했어요."));
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!settings || saving || loading) return;
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      setError("현장 위도와 경도를 입력해 주세요.");
      return;
    }
    if (lat < 31 || lat > 44 || lon < 123 || lon > 133) {
      setError("대한민국 현장의 위도(31~44), 경도(123~133)를 확인해 주세요.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await hqApi.updateSiteWeatherLocation(siteId, {
        version: settings.version,
        weatherMode: "AUTOMATIC",
        weatherLocation: { latitude: lat, longitude: lon },
      });
    } catch (err) {
      setError(errorMessage(err, "날씨 설정을 저장하지 못했어요."));
      if (typeof err === "object" && err !== null && "status" in err && err.status === 409) {
        void load();
      }
      setSaving(false);
      return;
    }

    try {
      // Save returns the new optimistic-lock version and the latest KMA status.
      // Re-read the weather resource so the screen reflects the persisted state.
      const latest = await hqApi.getSiteWeather(siteId);
      setSettings(latest);
      setLatitude(latest.weatherLocation?.latitude == null ? String(lat) : String(latest.weatherLocation.latitude));
      setLongitude(latest.weatherLocation?.longitude == null ? String(lon) : String(latest.weatherLocation.longitude));
      await onSaved();
      showToast("현장 위치와 기상청 자동 조회 설정을 저장했어요.", "success");
    } catch (err) {
      setError(`설정은 저장했지만 날씨를 다시 조회하지 못했어요. ${errorMessage(err, "잠시 후 다시 시도해 주세요.")}`);
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
      <div>
        <h2 className="font-semibold text-[var(--color-text-heading)]">기상청 위치 설정</h2>
        <p className="pt-1 text-sm leading-6 text-[var(--color-text-body)]">현장의 위도와 경도를 저장하면 해당 위치의 기상청 날씨를 조회합니다.</p>
      </div>

      {loading ? (
        <p role="status" className="pt-4 text-sm text-[var(--color-text-body)]">날씨 설정을 불러오는 중이에요.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs text-[var(--color-text-body)]">
              위도
              <input className={fieldClass} inputMode="decimal" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="예: 37.5665" />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-[var(--color-text-body)]">
              경도
              <input className={fieldClass} inputMode="decimal" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="예: 126.9780" />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <p className="text-xs text-[var(--color-text-body)]">
              조회 모드: <span className="font-medium text-[var(--color-text-heading)]">{settings?.weatherMode === "AUTOMATIC" ? "기상청 자동 조회" : "수동"}</span>
              {settings?.availability === "LOCATION_REQUIRED" && <span className="ml-2">현장 위치를 등록해 주세요</span>}
            </p>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || loading || !settings?.version}
              className="h-10 rounded-md bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "저장하고 날씨 조회 중..." : "위치 저장 및 자동 조회"}
            </button>
          </div>
          {error && <p role="alert" className="pt-3 text-sm text-[var(--color-danger-text)]">{error}</p>}
          {settings?.availability === "UNAVAILABLE" && (
            <p className="pt-3 text-xs text-[var(--color-text-body)]">위치는 저장됐지만 현재 기상청 날씨를 조회할 수 없어요. 잠시 후 다시 확인해 주세요.</p>
          )}
        </>
      )}
    </section>
  );
}
