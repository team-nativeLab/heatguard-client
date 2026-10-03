import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeLayout from "../../components/home/HomeLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import { useToast } from "../../shared/ui/Toast";
import { CheckboxCheckIcon } from "../../components/icons/Icons";
import { markSignedOut } from "../../shared/auth/RequireAuth";
import { clearSiteMeCache } from "../../hooks/useSiteMe";
import { settingsApi, siteApi, isDemoFallback, errorMessage } from "../../api";

const TIME_SLOTS = ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00"];
const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

const inputCls =
  "bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[38px] px-3 w-full text-[var(--color-text-heading)] text-sm font-['JetBrains_Mono',monospace] outline-none focus:border-[var(--color-accent)] transition";

export default function SiteSettingsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [temp, setTemp] = useState("");
  const [humidity, setHumidity] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [savingCheckTimes, setSavingCheckTimes] = useState(false);
  const [savingWeather, setSavingWeather] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([settingsApi.getCheckTimes(), settingsApi.getManualWeather(), siteApi.getProfile()]).then(
      ([times, weather, profile]) => {
        if (!alive) return;
        const failures = [times, weather, profile].filter((r) => r.status === "rejected") as PromiseRejectedResult[];
        if (failures.length && failures.every((f) => isDemoFallback(f.reason))) {
          // 데모 모드: 서버가 없으면 예시 값으로 채운다.
          setChecked({ "07:00": true, "09:00": true });
          setTemp("35");
          setHumidity("65");
          setPhone("032-000-0000");
        } else if (failures.length) {
          showToast("일부 설정을 불러오지 못했어요. 새로고침해주세요.", "error");
        }
        if (times.status === "fulfilled") setChecked(Object.fromEntries(times.value.times.map((t) => [t, true])));
        if (weather.status === "fulfilled") {
          if (weather.value.temperature != null) setTemp(String(weather.value.temperature));
          if (weather.value.humidity != null) setHumidity(String(weather.value.humidity));
        }
        if (profile.status === "fulfilled" && profile.value.manager.phone != null) setPhone(profile.value.manager.phone);
        setLoading(false);
      },
    );
    return () => {
      alive = false;
    };
  }, [showToast]);

  const toggle = (slot: string) => setChecked((prev) => ({ ...prev, [slot]: !prev[slot] }));

  const saveCheckTimes = async () => {
    if (savingCheckTimes) return;
    const checkTimes = TIME_SLOTS.filter((slot) => checked[slot]);
    if (checkTimes.length === 0) return showToast("체크 시간을 한 개 이상 선택해주세요.", "error");
    setSavingCheckTimes(true);
    try {
      await settingsApi.updateCheckTimes({ times: checkTimes });
      showToast("온도 체크 시간을 저장했어요.", "success");
    } catch (err) {
      if (isDemoFallback(err)) return showToast("온도 체크 시간을 저장했어요. (데모)", "success");
      showToast(errorMessage(err, "저장에 실패했어요."), "error");
    } finally {
      setSavingCheckTimes(false);
    }
  };

  const saveWeather = async () => {
    if (savingWeather) return;
    const temperature = Number(temp);
    const humidityNum = Number(humidity);
    if (temp.trim() === "" || humidity.trim() === "" || Number.isNaN(temperature) || Number.isNaN(humidityNum)) {
      return showToast("온도와 습도를 숫자로 입력해주세요.", "error");
    }
    if (temperature < -30 || temperature > 60) return showToast("온도는 -30~60°C 사이로 입력해주세요.", "error");
    if (humidityNum < 0 || humidityNum > 100) return showToast("습도는 0~100% 사이로 입력해주세요.", "error");
    setSavingWeather(true);
    try {
      await settingsApi.updateManualWeather({
        temperature,
        humidity: humidityNum,
        observedAt: new Date().toISOString(),
      });
      showToast(`온도 ${temperature}°C · 습도 ${humidityNum}%로 저장했어요.`, "success");
    } catch (err) {
      if (isDemoFallback(err)) return showToast(`온도 ${temperature}°C · 습도 ${humidityNum}%로 저장했어요. (데모)`, "success");
      showToast(errorMessage(err, "저장에 실패했어요."), "error");
    } finally {
      setSavingWeather(false);
    }
  };

  const savePhone = async () => {
    if (savingPhone) return;
    if (!PHONE_RE.test(phone.trim())) return showToast("전화번호 형식을 확인해주세요. (예: 032-000-0000)", "error");
    setSavingPhone(true);
    try {
      await siteApi.updateProfile({ managerPhone: phone.trim() });
      showToast("관리자 전화번호를 저장했어요.", "success");
    } catch (err) {
      if (isDemoFallback(err)) return showToast("관리자 전화번호를 저장했어요. (데모)", "success");
      showToast(errorMessage(err, "저장에 실패했어요."), "error");
    } finally {
      setSavingPhone(false);
    }
  };

  const closeDeleteDialog = () => {
    setConfirmingDelete(false);
    setDeletePassword("");
  };

  const confirmDeleteSite = async () => {
    if (deleting) return;
    if (!deletePassword) return showToast("현재 비밀번호를 입력해주세요.", "error");
    setDeleting(true);
    try {
      await siteApi.withdraw({ currentPassword: deletePassword });
      clearSiteMeCache();
      markSignedOut();
      showToast("회원탈퇴가 처리됐어요.");
      navigate("/auth/login", { replace: true });
    } catch (err) {
      if (isDemoFallback(err)) {
        clearSiteMeCache();
      markSignedOut();
        showToast("회원탈퇴가 처리됐어요. (데모)");
        navigate("/auth/login", { replace: true });
        return;
      }
      // 비밀번호가 틀린 경우 등은 창을 유지해 다시 입력할 수 있게 한다.
      showToast(errorMessage(err, "탈퇴 처리에 실패했어요."), "error");
      setDeletePassword("");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <HomeLayout>
      <SiteManagementHeader active="schedule" />

      <div aria-busy={loading} className={`grid grid-cols-1 md:grid-cols-2 gap-10 max-w-[720px] w-full pt-8 self-start ${loading ? "animate-pulse pointer-events-none" : ""}`}>
        <section>
          <h3 className="font-medium text-[var(--color-text-heading)] text-sm">온도 체크 시간</h3>
          <p className="text-[var(--color-text-body)] text-xs pt-1">선택한 시간마다 팀에 온도 측정 알림이 가요.</p>
          <div className="flex flex-col gap-1 pt-3">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                role="checkbox"
                aria-checked={!!checked[slot]}
                onClick={() => toggle(slot)}
                className="flex gap-3 items-center h-8 px-1 -mx-1 rounded-md hover:bg-[var(--color-bg-tile)]/60 transition text-left"
              >
                <span
                  className={`flex items-center justify-center size-4 rounded border transition ${
                    checked[slot] ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "border-[var(--color-checkbox-border)]"
                  }`}
                >
                  {checked[slot] && <CheckboxCheckIcon className="size-2.5 text-white" />}
                </span>
                <span className="font-['JetBrains_Mono',monospace] text-[var(--color-text-value)] text-sm">{slot}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={saveCheckTimes}
            disabled={loading || savingCheckTimes}
            className="border border-[var(--color-border)] rounded-lg h-[38px] px-4 text-sm text-[var(--color-text-label)] mt-4 hover:bg-[var(--color-bg-tile)] transition disabled:opacity-60"
          >
            {savingCheckTimes ? "저장 중..." : "체크 시간 저장"}
          </button>
        </section>

        <section>
          <h3 className="font-medium text-[var(--color-text-heading)] text-sm">기상청 수동 입력</h3>
          <p className="text-[var(--color-text-body)] text-xs pt-1">기상청 데이터를 받지 못할 때 대신 쓰는 값이에요.</p>
          <div className="grid grid-cols-2 gap-3 py-3">
            <label className="block">
              <span className="block text-[var(--color-text-body)] text-xs pb-1.5">온도 (°C)</span>
              <input inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="block text-[var(--color-text-body)] text-xs pb-1.5">습도 (%)</span>
              <input inputMode="numeric" value={humidity} onChange={(e) => setHumidity(e.target.value)} className={inputCls} />
            </label>
          </div>
          <button
            type="button"
            onClick={saveWeather}
            disabled={loading || savingWeather}
            className="bg-[var(--color-accent)] rounded-lg h-9 text-sm font-medium text-white w-full hover:brightness-110 transition disabled:opacity-60"
          >
            {savingWeather ? "저장 중..." : "저장"}
          </button>

          <div className="pt-6">
            <h3 className="font-medium text-[var(--color-text-heading)] text-sm">관리자 전화번호</h3>
            <p className="text-[var(--color-text-body)] text-xs pt-1">긴급 호출 시 팀원에게 안내되는 번호예요.</p>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputCls} mt-3`} />
            <button
              type="button"
              onClick={savePhone}
              disabled={loading || savingPhone}
              className="border border-[var(--color-border)] rounded-lg h-[38px] text-sm text-[var(--color-text-label)] w-full mt-2 hover:bg-[var(--color-bg-tile)] transition disabled:opacity-60"
            >
              {savingPhone ? "저장 중..." : "저장"}
            </button>
          </div>

          <div className="border-t border-[var(--color-border)] pt-5 mt-6">
            <h3 className="font-medium text-[var(--color-danger-text)] text-sm">회원 탈퇴</h3>
            <p className="text-[var(--color-text-body)] text-xs leading-[1.6] pt-2 pb-3">
              탈퇴 시 계정·현장·팀이 비활성화됩니다. 기록·사진은 즉시 삭제되지 않고 365일 보관 후 완전삭제됩니다.
            </p>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="border border-[var(--color-modal-danger-border)] rounded-lg h-[38px] px-4 text-sm text-[var(--color-danger-text)] hover:bg-[var(--color-danger-soft-bg)] transition"
            >
              회원 탈퇴
            </button>
          </div>
        </section>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="정말 탈퇴할까요?"
          description="현재 비밀번호를 확인해야 탈퇴가 진행됩니다. 기록·사진은 365일간 보관 후 완전삭제돼요."
          confirmLabel={deleting ? "처리 중..." : "탈퇴"}
          destructive
          busy={deleting}
          onCancel={closeDeleteDialog}
          onConfirm={confirmDeleteSite}
        >
          <input
            type="password"
            autoFocus
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmDeleteSite()}
            placeholder="현재 비밀번호"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[38px] w-full px-3 text-sm text-[var(--color-text-heading)] placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] transition-colors mt-3"
          />
        </ConfirmDialog>
      )}
    </HomeLayout>
  );
}
