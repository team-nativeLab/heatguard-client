import { WarningIcon, CheckIcon, CloseIcon } from "../icons/Icons";
import { useEscapeKey } from "../../shared/ui/useEscapeKey";
import type { EmergencyCall } from "../../api";

export type EmergencyStatus = "test" | "dispatching" | "confirmed";

const pad = (n: number) => String(n).padStart(2, "0");

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EmergencyModal({
  status,
  info,
  confirming = false,
  onConfirm,
  onLocate,
  onDispatch,
  onClose,
}: {
  status: EmergencyStatus;
  info?: EmergencyCall;
  confirming?: boolean;
  onConfirm?: () => void;
  onLocate?: () => void;
  onDispatch?: () => void;
  onClose?: () => void;
}) {
  useEscapeKey(onClose);

  const siteInfo = info
    ? [
        { label: "팀명", value: info.teamName },
        { label: "발생 시간", value: formatDateTime(info.createdAt) },
      ]
    : [
        { label: "팀명", value: "테스트 호출" },
        { label: "발생 시간", value: formatDateTime(new Date().toISOString()) },
      ];

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="긴급 호출"
      className="fixed inset-0 backdrop-blur-sm bg-black/70 flex items-center justify-center z-[95] px-4 animate-[fadeIn_0.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-modal-danger-border)] rounded-xl shadow-2xl w-full max-w-[512px] overflow-hidden relative">
        <div className="bg-[#ef4444] flex gap-3 items-center px-5 py-4">
          <div className="bg-white/20 flex items-center justify-center rounded-full shrink-0 size-9">
            <WarningIcon className="size-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-5 text-sm text-white">
              {status === "test" ? "긴급 호출 테스트" : "긴급 호출이 발생했습니다."}
            </p>
            <p className="leading-4 text-xs text-white/80 pt-0.5">
              {status === "test" ? "실제 호출이 아닌 화면 확인용 테스트예요." : "즉시 조치가 필요합니다. 현장으로 이동해주세요."}
            </p>
          </div>
          {status === "test" && (
            <button
              type="button"
              onClick={onDispatch}
              className="bg-white/20 flex items-center justify-center px-3 py-1.5 rounded shrink-0 text-xs text-white font-medium hover:bg-white/30 transition"
            >
              긴급 출동
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 size-7 flex items-center justify-center rounded-md text-white/80 hover:text-white hover:bg-white/15 transition"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="flex flex-col p-6 w-full gap-6">
          <div className="grid grid-cols-2 gap-6 w-full">
            <div>
              <p className="font-medium leading-4 text-[var(--color-text-body)] text-xs">현장 정보</p>
              <div className="flex flex-col pt-3 gap-2.5">
                {siteInfo.map((row) => (
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
                <div className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded-lg flex items-center justify-center h-[90px] p-4">
                  {status === "confirmed" ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="bg-[var(--color-success-soft-bg)] flex items-center justify-center rounded-full size-6">
                        <CheckIcon className="size-3.5 text-[var(--color-success)]" />
                      </div>
                      <p className="leading-4 text-[var(--color-success)] text-xs text-center">현장 확인 완료</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full rounded-full bg-[#ef4444] opacity-75 animate-ping" />
                        <span className="relative inline-flex size-2 rounded-full bg-[#ef4444]" />
                      </span>
                      <p className="leading-5 text-[var(--color-text-label)] text-sm text-center">확인 대기 중</p>
                    </div>
                  )}
                </div>
                <p className="leading-[16.5px] text-[var(--color-text-body)] text-[11px] pt-2">
                  {status === "confirmed" ? "팀에 확인 알림이 전송됐어요." : "‘현장 확인’을 누르면 팀에 확인 알림이 전송돼요."}
                </p>
              </div>
            </div>
          </div>

          <div className="border-[var(--color-border)] border-solid border-t flex gap-3 items-center pt-4 w-full">
            <button
              type="button"
              onClick={onConfirm}
              disabled={status === "confirmed" || confirming}
              className="bg-[var(--color-accent)] flex items-center justify-center px-5 py-2.5 rounded-lg text-sm text-white font-medium hover:brightness-110 transition disabled:opacity-50"
            >
              {confirming ? "처리 중..." : status === "confirmed" ? "확인 완료" : "현장 확인"}
            </button>
            <button
              type="button"
              onClick={onLocate}
              className="bg-[var(--color-bg-tile)] flex items-center justify-center px-5 py-2.5 rounded-lg text-sm text-[var(--color-text-label)] hover:brightness-95 transition"
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
