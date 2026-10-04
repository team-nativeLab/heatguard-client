// ⚠️ 자동 생성 파일 — heatguard-shared/src 에서 수정한 뒤 `node sync.mjs`로 반영하세요.
import { useTheme } from "../theme/ThemeContext";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.75" fill="currentColor" />
      <path
        d="M8 1.75v1.1M8 13.15v1.1M1.75 8h1.1M13.15 8h1.1M3.58 3.58l.78.78M11.64 11.64l.78.78M3.58 12.42l.78-.78M11.64 4.36l.78-.78"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.25 9.6A5.5 5.5 0 0 1 6.4 2.75a5.5 5.5 0 1 0 6.85 6.85Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ThemeToggleButton({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "라이트 모드로 전환" : "다크 모드로 전환";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`group relative inline-flex items-center shrink-0 w-[56px] h-[30px] rounded-full p-[3px] outline-none
        border transition-[background,border-color,box-shadow] duration-300
        focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-main-bg)]
        ${
          isDark
            ? "bg-[linear-gradient(135deg,#1b2030_0%,#10131b_100%)] border-white/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
            : "bg-[linear-gradient(135deg,#eef3fd_0%,#dfe7f6_100%)] border-[#d3dcec] shadow-[inset_0_1px_2px_rgba(30,50,90,0.08)]"
        } ${className}`}
    >
      {/* 트랙 안쪽 보조 아이콘 */}
      <span
        aria-hidden="true"
        className={`absolute top-1/2 -translate-y-1/2 size-3 transition-opacity duration-300 ${
          isDark ? "left-[9px] text-[#fbbf24]/50" : "right-[9px] text-[#64748b]/45"
        }`}
      >
        {isDark ? <SunIcon className="size-3" /> : <MoonIcon className="size-3" />}
      </span>

      {/* 썸 */}
      <span
        className={`relative z-10 flex items-center justify-center size-6 rounded-full
          transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]
          ${
            isDark
              ? "translate-x-[26px] bg-[linear-gradient(145deg,#3a4254_0%,#232937_100%)] text-[#dbe4ff] shadow-[0_2px_6px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]"
              : "translate-x-0 bg-[linear-gradient(145deg,#ffffff_0%,#f3f6fb_100%)] text-[#f59e0b] shadow-[0_2px_6px_rgba(30,50,90,0.18),inset_0_1px_0_rgba(255,255,255,0.9)]"
          }`}
      >
        {isDark ? <MoonIcon className="size-3.5" /> : <SunIcon className="size-3.5" />}
      </span>
    </button>
  );
}
