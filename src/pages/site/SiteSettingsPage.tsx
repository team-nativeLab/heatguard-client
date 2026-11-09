import { useEffect, useState } from "react";
import HomeLayout from "../../components/home/HomeLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import { CheckboxCheckIcon } from "../../components/icons/Icons";
import { settingsApi, isDemoFallback, errorMessage } from "../../api";
import { useToast } from "../../shared/ui/Toast";

const TIME_SLOTS = Array.from({ length: 24 }, (_, index) => `${String(index + 1).padStart(2, "0")}:00`);
const ALL_CHECKED_TIMES = Object.fromEntries(TIME_SLOTS.map((time) => [time, true]));

export default function SiteSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    settingsApi.getCheckTimes().then((times) => {
      if (alive) setChecked(times.times.length > 0 ? Object.fromEntries(times.times.map((time) => [time, true])) : ALL_CHECKED_TIMES);
    }).catch((err) => {
      if (!alive) return;
      if (isDemoFallback(err)) setChecked(ALL_CHECKED_TIMES);
      else showToast(errorMessage(err, "체크 시간을 불러오지 못했어요."), "error");
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [showToast]);

  const saveCheckTimes = async () => {
    if (saving) return;
    const times = TIME_SLOTS.filter((time) => checked[time]);
    if (times.length === 0) return showToast("체크 시간을 한 개 이상 선택해주세요.", "error");
    setSaving(true);
    try {
      await settingsApi.updateCheckTimes({ times });
      showToast("온도 체크 시간을 저장했어요.", "success");
    } catch (err) {
      if (isDemoFallback(err)) return showToast("온도 체크 시간을 저장했어요. (데모)", "success");
      showToast(errorMessage(err, "저장에 실패했어요."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HomeLayout>
      <SiteManagementHeader active="schedule" />
      <section aria-busy={loading} className={`w-full max-w-[720px] pt-8 self-start ${loading ? "animate-pulse pointer-events-none" : ""}`}>
        <h2 className="font-medium text-[var(--color-text-heading)] text-sm">온도 체크 시간</h2>
        <p className="text-[var(--color-text-body)] text-xs pt-1">선택한 시간마다 팀에 온도 측정 알림이 가요.</p>
        <div className="flex flex-col gap-2 pt-3">
          {[TIME_SLOTS.slice(0, 12), TIME_SLOTS.slice(12, 24)].map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-6 sm:grid-cols-12 gap-x-1">
              {row.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  role="checkbox"
                  aria-checked={!!checked[slot]}
                  aria-label={`${slot} 온도 체크`}
                  onClick={() => setChecked((previous) => ({ ...previous, [slot]: !previous[slot] }))}
                  className="flex min-w-0 gap-1 items-center justify-center h-8 rounded-md hover:bg-[var(--color-bg-tile)]/60 transition"
                >
                  <span className={`flex shrink-0 items-center justify-center size-3.5 rounded border transition ${checked[slot] ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "border-[var(--color-checkbox-border)]"}`}>
                    {checked[slot] && <CheckboxCheckIcon className="size-2.5 text-white" />}
                  </span>
                  <span className="font-['JetBrains_Mono',monospace] text-[var(--color-text-value)] text-[11px] sm:text-xs">{slot.slice(0, 2)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={saveCheckTimes}
          disabled={loading || saving}
          className="border border-[var(--color-border)] rounded-lg h-[38px] px-4 text-sm text-[var(--color-text-label)] mt-4 hover:bg-[var(--color-bg-tile)] transition disabled:opacity-60"
        >
          {saving ? "저장 중..." : "체크 시간 저장"}
        </button>
      </section>
    </HomeLayout>
  );
}

