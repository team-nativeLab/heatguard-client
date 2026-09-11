import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ManagerLayout from "../../components/manager/ManagerLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { CheckboxCheckIcon } from "../../components/icons/Icons";

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

  const toggle = (slot: string) =>
    setChecked((prev) => ({ ...prev, [slot]: !prev[slot] }));

  return (
    <ManagerLayout>
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
                <span className="font-['JetBrains_Mono',monospace] text-[var(--color-text-value)] text-sm">
                  {slot}
                </span>
              </label>
            ))}
          </div>
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
            onClick={() => showToast(`온도 ${temp}°C · 습도 ${humidity}%로 저장했어요.`, "success")}
            className="bg-[var(--color-accent)] rounded h-9 text-sm font-medium text-white w-full hover:brightness-110 transition"
          >
            저장
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
              onClick={() => showToast("관리자 전화번호를 저장했어요.", "success")}
              className="border border-[var(--color-border)] rounded h-[38px] text-sm text-[var(--color-text-label)] w-full mt-2 hover:brightness-125 transition"
            >
              저장
            </button>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4 mt-5">
            <h3 className="font-medium text-[var(--color-danger-text)] text-sm">현장 삭제</h3>
            <p className="text-[var(--color-text-body)] text-xs pt-2 pb-3">삭제해도 업로드된 기록은 유지됩니다.</p>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="border border-[var(--color-modal-danger-border)] rounded h-[38px] px-4 text-sm text-[var(--color-danger-text)] hover:bg-[#2d0a0a]/20 transition"
            >
              현장 삭제
            </button>
          </div>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="현장을 삭제할까요?"
          description="삭제해도 업로드된 기록은 유지되지만, 이 현장은 목록에서 사라져요."
          confirmLabel="삭제"
          destructive
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            showToast("현장을 삭제했어요.");
            navigate("/manager");
          }}
        />
      )}
    </ManagerLayout>
  );
}
