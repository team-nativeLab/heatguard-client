import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeLayout from "../../components/home/HomeLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { CheckboxCheckIcon } from "../../components/icons/Icons";
import { settingsApi, siteApi, isNetworkError, ApiError } from "../../api";

const TIME_SLOTS = ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00"];

export default function Screen17_현장관리_시간설정() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [checked, setChecked] = useState<Record<string, boolean>>({
    "07:00": true,
    "09:00": true,
  });
  const [temp, setTemp] = useState("35");
  const [humidity, setHumidity] = useState("65");
  const [phone, setPhone] = useState("032-000-0000");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [savingCheckTimes, setSavingCheckTimes] = useState(false);
  const [savingWeather, setSavingWeather] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggle = (slot: string) => setChecked((prev) => ({ ...prev, [slot]: !prev[slot] }));

  const saveCheckTimes = async () => {
    if (savingCheckTimes) return;
    setSavingCheckTimes(true);
    const checkTimes = TIME_SLOTS.filter((slot) => checked[slot]);
    try {
      await settingsApi.updateCheckTimes({ times: checkTimes });
      showToast("온도 체크 시간을 저장했어요.", "success");
    } catch (err) {
      if (isNetworkError(err)) {
        showToast("온도 체크 시간을 저장했어요. (데모)", "success");
        return;
      }
      showToast(err instanceof ApiError ? err.message : "저장에 실패했어요.", "error");
    } finally {
      setSavingCheckTimes(false);
    }
  };

  const saveWeather = async () => {
    if (savingWeather) return;
    const temperature = Number(temp);
    const humidityNum = Number(humidity);
    if (Number.isNaN(temperature) || Number.isNaN(humidityNum)) {
      showToast("온도/습도는 숫자로 입력해주세요.", "error");
      return;
    }
    setSavingWeather(true);
    try {
      await settingsApi.updateManualWeather({ temperature, humidity: humidityNum });
      showToast(`온도 ${temp}°C · 습도 ${humidity}%로 저장했어요.`, "success");
    } catch (err) {
      if (isNetworkError(err)) {
        showToast(`온도 ${temp}°C · 습도 ${humidity}%로 저장했어요. (데모)`, "success");
        return;
      }
      showToast(err instanceof ApiError ? err.message : "저장에 실패했어요.", "error");
    } finally {
      setSavingWeather(false);
    }
  };

  const savePhone = async () => {
    if (savingPhone) return;
    setSavingPhone(true);
    try {
      await siteApi.updateProfile({ managerPhone: phone });
      showToast("관리자 전화번호를 저장했어요.", "success");
    } catch (err) {
      if (isNetworkError(err)) {
        showToast("관리자 전화번호를 저장했어요. (데모)", "success");
        return;
      }
      showToast(err instanceof ApiError ? err.message : "저장에 실패했어요.", "error");
    } finally {
      setSavingPhone(false);
    }
  };

  const confirmDeleteSite = async () => {
    if (deleting) return;
    if (!deletePassword) {
      showToast("현재 비밀번호를 입력해주세요.", "error");
      return;
    }
    setDeleting(true);
    try {
      await siteApi.withdraw({ currentPassword: deletePassword });
      showToast("회원탈퇴가 처리됐어요.");
      navigate("/auth/login");
    } catch (err) {
      if (isNetworkError(err)) {
        showToast("회원탈퇴가 처리됐어요. (데모)");
        navigate("/auth/login");
        return;
      }
      showToast(err instanceof ApiError ? err.message : "탈퇴 처리에 실패했어요.", "error");
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
      setDeletePassword("");
    }
  };

  return (
    <HomeLayout>
      <SiteManagementHeader active="schedule" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[672px] w-full pt-8">
        <div>
          <h3 className="font-medium text-[var(--color-text-heading)] text-sm">온도 체크 시간</h3>
          <div className="flex flex-col gap-2 pt-3">
            {TIME_SLOTS.map((slot) => (
              <label key={slot} className="flex gap-3 items-center cursor-pointer select-none">
                <span
                  onClick={() => toggle(slot)}
                  className={`flex items-center justify-center size-4 rounded border transition ${
                    checked[slot]
                      ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                      : "border-[var(--color-checkbox-border)]"
                  }`}
                >
                  {checked[slot] && <CheckboxCheckIcon className="size-2.5 text-white" />}
                </span>
                <span className="font-['JetBrains_Mono',monospace] text-[var(--color-text-value)] text-sm">{slot}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={saveCheckTimes}
            disabled={savingCheckTimes}
            className="border border-[var(--color-border)] rounded h-[38px] px-4 text-sm text-[var(--color-text-label)] mt-4 hover:brightness-125 transition disabled:opacity-60"
          >
            {savingCheckTimes ? "저장 중..." : "체크 시간 저장"}
          </button>
        </div>

        <div>
          <h3 className="font-medium text-[var(--color-text-heading)] text-sm">기상청 수동 입력</h3>
          <div className="grid grid-cols-2 gap-3 py-3">
            <div>
              <label className="block text-[var(--color-text-body)] text-xs pb-1.5">온도 (°C)</label>
              <input
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded h-[38px] px-3 w-full text-[var(--color-text-heading)] text-sm font-['JetBrains_Mono',monospace] outline-none focus:border-[var(--color-accent)] transition"
              />
            </div>
            <div>
              <label className="block text-[var(--color-text-body)] text-xs pb-1.5">습도 (%)</label>
              <input
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded h-[38px] px-3 w-full text-[var(--color-text-heading)] text-sm font-['JetBrains_Mono',monospace] outline-none focus:border-[var(--color-accent)] transition"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={saveWeather}
            disabled={savingWeather}
            className="bg-[var(--color-accent)] rounded h-9 text-sm font-medium text-white w-full hover:brightness-110 transition disabled:opacity-60"
          >
            {savingWeather ? "저장 중..." : "저장"}
          </button>

          <div className="pt-5">
            <h3 className="font-medium text-[var(--color-text-heading)] text-sm">관리자 전화번호</h3>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded h-[38px] px-3 w-full mt-3 text-[var(--color-text-heading)] text-sm font-['JetBrains_Mono',monospace] outline-none focus:border-[var(--color-accent)] transition"
            />
            <button
              type="button"
              onClick={savePhone}
              disabled={savingPhone}
              className="border border-[var(--color-border)] rounded h-[38px] text-sm text-[var(--color-text-label)] w-full mt-2 hover:brightness-125 transition disabled:opacity-60"
            >
              {savingPhone ? "저장 중..." : "저장"}
            </button>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4 mt-5">
            <h3 className="font-medium text-[var(--color-danger-text)] text-sm">회원 탈퇴</h3>
            <p className="text-[var(--color-text-body)] text-xs pt-2 pb-3">
              탈퇴 시 계정·현장·팀이 비활성화됩니다. 기록·사진은 즉시 삭제되지 않고 365일 보관 후 완전삭제됩니다.
            </p>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="border border-[var(--color-modal-danger-border)] rounded h-[38px] px-4 text-sm text-[var(--color-danger-text)] hover:bg-[#2d0a0a]/20 transition"
            >
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="정말 탈퇴할까요?"
          description="현재 비밀번호를 확인해야 탈퇴가 진행됩니다. 기록·사진은 365일간 보관 후 완전삭제돼요."
          confirmLabel={deleting ? "처리 중..." : "탈퇴"}
          destructive
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={confirmDeleteSite}
        >
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="현재 비밀번호"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded h-[38px] w-full px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors mt-3"
          />
        </ConfirmDialog>
      )}
    </HomeLayout>
  );
}
