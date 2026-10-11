import { useTheme } from "../../shared/theme/ThemeContext";
import moon from "../../assets/auth/moon.png";
import sun from "../../assets/auth/sun.png";

/** 로그인·회원가입 우상단 테마 전환 버튼 (36×36 정사각 버튼) */
export default function AuthMobileThemeButton({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const label = isLight ? "다크 모드로 전환" : "라이트 모드로 전환";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`flex size-9 items-center justify-center rounded-[10px] border-[1.5px] border-transparent bg-[var(--auth-m-input-bg)] transition-colors hover:border-[var(--auth-m-accent)] ${className}`}
    >
      <img src={isLight ? sun : moon} alt="" width={18} height={18} draggable={false} />
    </button>
  );
}
