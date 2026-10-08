import type { ReactNode } from "react";
import { useEscapeKey } from "../../shared/ui/useEscapeKey";

/** 페이지 안에서 쓰는 공용 모달 껍데기 (Figma Modal/* — 헤더·본문·푸터 구조) */
export default function ModalShell({
  title,
  onClose,
  children,
  footer,
  maxWidth = 520,
  busy = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  maxWidth?: number;
  busy?: boolean;
}) {
  useEscapeKey(busy ? undefined : onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="flex max-h-[calc(100vh-32px)] w-full flex-col overflow-hidden rounded-[10px] border border-[var(--home-card-border)] bg-[var(--home-card-bg)] shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
        style={{ maxWidth }}
      >
        <div className="flex items-center border-b border-[var(--home-card-border)] px-6 py-[18px]">
          <h2 className="flex-1 text-base font-bold leading-[1.45] text-[var(--color-text-heading)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="닫기"
            className="text-[var(--color-text-body)] transition-colors hover:text-[var(--color-text-heading)] disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-[var(--home-card-border)] bg-[var(--color-bg-surface)] px-6 py-4">{footer}</div>
      </div>
    </div>
  );
}

export const btnPrimary =
  "rounded bg-[var(--color-accent)] px-[18px] py-2 text-[13px] font-medium leading-[1.45] text-white transition hover:brightness-110 disabled:opacity-60";
export const btnSecondary =
  "rounded border border-[var(--home-card-border)] bg-[var(--home-card-bg)] px-[18px] py-2 text-[13px] font-medium leading-[1.45] text-[var(--color-text-label)] transition hover:bg-[var(--color-bg-tile)] disabled:opacity-60";
export const inputCls =
  "h-[38px] w-full rounded border border-[var(--home-card-border)] bg-[var(--color-bg-surface)] px-3 text-[13px] text-[var(--color-text-heading)] outline-none transition-colors placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)]";
