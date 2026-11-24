import { useEffect, useId, useRef, type ReactNode } from "react";
import OpsIcon, { type OpsIconName } from "./OpsIcon";
import { CARD } from "./opsStyles";

/* 운영자 콘솔 목록 화면들이 함께 쓰는 입력·칩·패널 (Figma 운영자 콘솔 03~05). */

export type ChipTone = "neutral" | "success" | "warning" | "danger" | "accent";

const CHIP_TONE: Record<ChipTone, string> = {
  neutral: "bg-[var(--ops-chip-bg)] text-[var(--ops-body)]",
  success: "bg-[var(--ops-success-bg)] text-[var(--ops-success-fg)]",
  warning: "bg-[var(--ops-warning-bg)] text-[var(--ops-warning-fg)]",
  danger: "bg-[var(--color-danger-soft-bg)] text-[var(--color-danger-text)]",
  accent: "bg-[var(--ops-accent-soft)] text-[var(--ops-accent)]",
};

export function Chip({ tone = "neutral", dot = false, children }: { tone?: ChipTone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${CHIP_TONE[tone]}`}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <label className="relative flex h-[38px] min-w-[220px] flex-1 items-center sm:max-w-[320px]">
      <OpsIcon name="search" className="pointer-events-none absolute left-3 text-[var(--ops-faint)]" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-full w-full rounded-[10px] border border-[var(--ops-border)] bg-[var(--ops-surface)] pl-9 pr-3 text-[13px] text-[var(--ops-heading)] outline-none placeholder:text-[var(--ops-faint)] focus:border-[var(--ops-accent)]"
      />
    </label>
  );
}

export function OpsSelect<T extends string>({ value, onChange, options, label, icon }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  icon?: OpsIconName;
}) {
  return (
    <label className="relative inline-flex h-[38px] items-center gap-2 rounded-[10px] border border-[var(--ops-border)] bg-[var(--ops-surface)] pl-3 pr-9 text-[13px] font-medium text-[var(--ops-body)] focus-within:ring-2 focus-within:ring-[var(--ops-accent)]">
      {icon && <OpsIcon name={icon} size={15} />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={label}
        className="cursor-pointer appearance-none bg-transparent outline-none [color-scheme:var(--native-color-scheme)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <OpsIcon name="chevDown" size={14} className="pointer-events-none absolute right-3" />
    </label>
  );
}

/** 알약 모양 탭 (회원 관리·활동 로그) */
export function PillTabs<T extends string>({ tabs, value, onChange, label }: {
  tabs: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-1 self-start rounded-full border border-[var(--ops-border)] bg-[var(--ops-surface)] p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
            value === t.key ? "bg-[var(--ops-accent)] font-bold text-white" : "font-medium text-[var(--ops-body)] hover:bg-[var(--ops-chip-bg)]"
          }`}
        >
          {t.label}{t.count != null ? ` ${t.count}` : ""}
        </button>
      ))}
    </div>
  );
}

/** 밑줄 탭 (가입 승인) */
export function UnderlineTabs<T extends string>({ tabs, value, onChange, label }: {
  tabs: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-6 overflow-x-auto overflow-y-hidden border-b border-[var(--ops-border)]">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 text-sm transition-colors ${
            value === t.key ? "border-[var(--ops-accent)] font-bold text-[var(--ops-heading)]" : "border-transparent font-medium text-[var(--ops-body)] hover:text-[var(--ops-heading)]"
          }`}
        >
          {t.label}
          {t.count != null && <span className={`text-[11px] ${value === t.key ? "text-[var(--ops-accent)]" : "text-[var(--ops-faint)]"}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** 서버에 아직 기능이 없을 때. 가짜 숫자 대신 이 안내를 보여준다. */
export function UnavailableState({ feature }: { feature: string }) {
  return (
    <div className={`${CARD} flex min-h-[320px] flex-col items-center justify-center gap-2 p-10 text-center`}>
      <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--ops-chip-bg)] text-[var(--ops-faint)]">
        <OpsIcon name="settings" size={18} />
      </span>
      <p className="text-sm font-bold text-[var(--ops-heading)]">{feature} 기능은 서버 준비 중이에요</p>
      <p className="text-[13px] text-[var(--ops-faint)]">서버에 API가 배포되면 이 화면에 바로 표시돼요.</p>
    </div>
  );
}

export function CenterMessage({ children, tone = "faint" }: { children: ReactNode; tone?: "faint" | "danger" }) {
  return (
    <p role={tone === "danger" ? "alert" : "status"} className={`m-auto px-6 py-10 text-center text-sm ${tone === "danger" ? "text-[var(--color-danger-text)]" : "text-[var(--ops-faint)]"}`}>
      {children}
    </p>
  );
}

export const BTN_PRIMARY = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--ops-accent)] px-3.5 text-[13px] font-medium text-white transition hover:brightness-110 disabled:opacity-60";
export const BTN_SECONDARY = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] px-3.5 text-[13px] font-medium text-[var(--ops-body)] transition-colors hover:bg-[var(--ops-chip-bg)] disabled:opacity-60";
export const BTN_DANGER = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-danger-border)] bg-[var(--ops-surface)] px-3.5 text-[13px] font-medium text-[var(--color-danger-text)] transition-colors hover:bg-[var(--color-danger-soft-bg)] disabled:opacity-60";

/**
 * 열린 패널·모달 순서. Esc는 맨 위(가장 나중에 열린) 것만 닫는다.
 * 패널 위에 확인 모달이 떠 있을 때 Esc 한 번에 둘 다 닫히지 않게 하기 위해서다.
 */
const escapeStack: symbol[] = [];

function useEscape(onClose: () => void) {
  const ref = useRef(onClose);
  useEffect(() => {
    ref.current = onClose;
  });
  useEffect(() => {
    const id = Symbol("dialog");
    escapeStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && escapeStack[escapeStack.length - 1] === id) ref.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const i = escapeStack.indexOf(id);
      if (i >= 0) escapeStack.splice(i, 1);
    };
  }, []);
}

/** 오른쪽에서 열리는 상세 패널 (Figma 03-1 회사 상세, 04-1 신청 상세) */
export function SidePanel({ title, onClose, footer, children }: { title: string; onClose: () => void; footer?: ReactNode; children: ReactNode }) {
  const titleId = useId();
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-[rgba(17,24,39,0.35)]" />
      <aside role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative flex h-full w-full max-w-[520px] flex-col bg-[var(--ops-surface)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--ops-border)] px-6 py-5">
          <h2 id={titleId} className="text-lg font-bold text-[var(--ops-heading)]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex size-8 items-center justify-center rounded-lg bg-[var(--ops-chip-bg)] text-[var(--ops-body)] hover:brightness-95">
            <OpsIcon name="close" size={14} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex gap-2 border-t border-[var(--ops-border)] px-6 py-4">{footer}</footer>}
      </aside>
    </div>
  );
}

export function OpsModal({ title, description, icon, onClose, footer, children }: {
  title: string;
  description?: string;
  icon?: ReactNode;
  onClose: () => void;
  footer: ReactNode;
  children?: ReactNode;
}) {
  const titleId = useId();
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-[rgba(17,24,39,0.35)]" />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative flex w-full max-w-[400px] flex-col gap-4 rounded-2xl bg-[var(--ops-surface)] p-6 shadow-2xl">
        <button type="button" onClick={onClose} aria-label="닫기" className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg bg-[var(--ops-chip-bg)] text-[var(--ops-body)]">
          <OpsIcon name="close" size={14} />
        </button>
        {icon}
        <div className="flex flex-col gap-1 pr-8">
          <h2 id={titleId} className="text-lg font-bold text-[var(--ops-heading)]">{title}</h2>
          {description && <p className="text-[13px] text-[var(--ops-body)]">{description}</p>}
        </div>
        {children}
        <div className="flex justify-end gap-2 pt-2">{footer}</div>
      </div>
    </div>
  );
}

/** 상세 패널의 "이름 / 값" 줄 */
export function InfoRow({ label, children, trailing }: { label: string; children: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1.5 text-[13px]">
      <span className="w-[100px] shrink-0 text-[var(--ops-faint)]">{label}</span>
      <span className="min-w-0 flex-1 font-medium text-[var(--ops-heading)]">{children || "–"}</span>
      {trailing}
    </div>
  );
}

export function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-[var(--ops-divider)] py-4 first:pt-0 last:border-b-0">
      <h3 className="pb-2 text-[13px] font-bold text-[var(--ops-body)]">{title}</h3>
      {children}
    </section>
  );
}
