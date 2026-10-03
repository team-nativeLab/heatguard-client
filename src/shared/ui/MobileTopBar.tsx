// ⚠️ 자동 생성 파일 — heatguard-shared/src 에서 수정한 뒤 `node sync.mjs`로 반영하세요.
import ThemeToggleButton from "./ThemeToggleButton";

/** 좁은 화면(768px 미만)에서 사이드바 대신 보이는 상단 바 */
export default function MobileTopBar({
  logo,
  subtitle,
  open,
  onToggle,
}: {
  logo: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="md:hidden sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--home-sidebar-bg)] px-4">
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        className="-ml-1 flex size-9 items-center justify-center rounded-md text-[var(--color-text-label)] transition hover:bg-[var(--home-nav-active-bg)]"
      >
        <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
          <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--home-nav-active-bg)]">
          <img alt="현장가드 로고" className="size-6 object-cover" src={logo} />
        </span>
        <p className="truncate text-sm font-semibold text-[var(--color-text-heading)]">현장가드</p>
        <span className="text-[10px] text-[var(--color-accent)]">{subtitle}</span>
      </div>
      <ThemeToggleButton />
    </div>
  );
}
