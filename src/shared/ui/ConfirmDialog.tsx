// ⚠️ 자동 생성 파일 — heatguard-shared/src 에서 수정한 뒤 `node sync.mjs`로 반영하세요.
import type { ReactNode } from "react";
import { useEscapeKey } from "./useEscapeKey";

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive = false,
  busy = false,
  hideCancel = false,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  useEscapeKey(busy ? undefined : onCancel);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-[90] px-4 animate-[fadeIn_0.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-[380px] p-6 flex flex-col items-start">
        <h3 className="font-semibold text-[var(--color-text-heading)] text-base">{title}</h3>
        {description && <p className="text-[var(--color-text-body)] text-sm leading-[1.6] pt-2 whitespace-pre-line">{description}</p>}
        {children && <div className="w-full">{children}</div>}
        <div className="flex gap-2 pt-6 w-full justify-end">
          {!hideCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="border border-[var(--color-border)] text-[var(--color-text-label)] text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-bg-tile)] transition disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`text-sm font-medium px-4 py-2 rounded-lg text-white transition hover:brightness-110 disabled:opacity-60 ${
              destructive ? "bg-[#dc2626]" : "bg-[var(--color-accent)]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
