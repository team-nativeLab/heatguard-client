import { useEffect } from "react";
import { WarningIcon, CheckIcon } from "../icons/Icons";

export type EmergencyStatus = "test" | "dispatching" | "confirmed";

const SITE_INFO = [
  { label: "현장명", value: "인천 복합물류센터 신축" },
  { label: "위치", value: "인천광역시 서구 원창동" },
  { label: "발생 시간", value: "2026.08.05 14:32" },
  { label: "연락처", value: "010-1234-5678" },
];

export default function EmergencyModal({
  status,
  onConfirm,
  onLocate,
  onDispatch,
  onClose,
}: {
  status: EmergencyStatus;
  onConfirm?: () => void;
  onLocate?: () => void;
  onDispatch?: () => void;
  onClose?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 backdrop-blur-sm bg-black/85 flex items-center justify-center z-50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="bg-[var(--color-bg-card)] border border-[var(--color-modal-danger-border)] rounded-xl shadow-2xl w-full max-w-[512px] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 text-white/70 hover:text-white text-lg leading-none z-10 size-6 flex items-center justify-center"
        >
        </button>
        <div className="bg-[#ef4444] flex gap-3 items-center px-5 py-4">
          <div className="bg-white/20 flex items-center justify-center rounded-full shrink-0 size-9">
            <WarningIcon className="size-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <p className="font-semibold leading-5 text-sm text-white">긴급 호출이 발생했습니다.</p>
            <p className="leading-4 text-xs text-white/80 pt-0.5">
              즉시 조치가 필요합니다. 현장으로 이동해주세요.
            </p>
          </div>
          {status === "test" && (
            <button
              type="button"
              onClick={onDispatch}
              className="bg-white/20 flex items-center justify-center px-3 py-1.5 rounded shrink-0 text-xs text-white font-medium hover:brightness-110 transition"
            >
              긴급 출동
            </button>
          )}
        </div>

        <div className="flex flex-col p-6 w-full gap-6">
          <div className="grid grid-cols-2 gap-6 w-full">
            <div>
              <p className="font-medium leading-4 text-[var(--color-text-body)] text-xs">현장 정보</p>
              <div className="flex flex-col pt-3 gap-2.5">
                {SITE_INFO.map((row) => (
                  <div key={row.label} className="flex gap-3">
                    <span className="w-16 shrink-0 leading-4 text-[var(--color-text-body)] text-xs">{row.label}</span>
                    <span className="font-medium leading-4 text-xs text-[var(--color-modal-strong-text)]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium leading-4 text-[var(--color-text-body)] text-xs">상태 정보</p>
              <div className="pt-3">
                {status === "confirmed" ? (
                  <div className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded-lg flex items-center justify-center h-[90px] p-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="bg-[var(--color-success-soft-bg)] flex items-center justify-center rounded-full size-6">
                        <CheckIcon className="size-3.5 text-[var(--color-success)]" />
                      </div>
                      <p className="leading-4 text-[var(--color-success)] text-xs text-center">현장 확인 완료</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded-lg flex items-center justify-center h-[90px] p-4">
                      <div className="flex flex-col items-center gap-2">
                        <span className="bg-[var(--color-accent)]/60 rounded-full size-2" />
                        <p className="leading-5 text-[var(--color-text-label)] text-sm text-center">구조대 이동 중...</p>
                      </div>
                    </div>
                    <p className="leading-[16.5px] text-[var(--color-text-body)] text-[11px] pt-2">
                      예상 도착 시간 : 8분 후
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="border-[var(--color-border)] border-solid border-t flex gap-3 items-center pt-4 w-full">
            <button
              type="button"
              onClick={onConfirm}
              className="bg-[var(--color-accent)] flex items-center justify-center px-5 py-2.5 rounded text-sm text-white font-medium hover:brightness-110 transition"
            >
              현장 확인
            </button>
            <button
              type="button"
              onClick={onLocate}
              className="bg-[var(--color-bg-tile)] flex items-center justify-center px-5 py-2.5 rounded text-sm text-[var(--color-text-label)] hover:brightness-125 transition"
            >
              위치 확인
            </button>
            <div className="flex flex-1 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="text-[var(--color-text-body)] text-xs hover:text-[var(--color-text-label)] transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
