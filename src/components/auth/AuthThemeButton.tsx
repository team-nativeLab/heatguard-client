import { useTheme } from "../../shared/theme/ThemeContext";
import { MoonIcon, SunIcon } from "./AuthIcons";

/** 인증 화면 우상단 테마 전환 버튼 (36×36 정사각 버튼) */
export default function AuthThemeButton({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const label = isLight ? "다크 모드로 전환" : "라이트 모드로 전환";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`flex size-9 items-center justify-center rounded-[10px] text-[var(--auth-text-body)] border border-[var(--auth-input-border)] bg-[var(--auth-input-bg)] transition-colors hover:border-[var(--auth-accent)] ${className}`}
    >
      {isLight ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
