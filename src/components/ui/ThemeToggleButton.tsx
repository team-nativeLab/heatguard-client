import { useTheme } from "../../theme/ThemeContext";

export default function ThemeToggleButton({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "다크 모드로 전환" : "라이트 모드로 전환"}
      title={isLight ? "다크 모드로 전환" : "라이트 모드로 전환"}
      className={`relative w-9 h-5 rounded-full border transition-colors shrink-0 ${
        isLight ? "bg-[#e3ddd4] border-[#d6cfc2]" : "bg-[#111418] border-[#1a1f26]"
      } ${className}`}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 size-4 rounded-full flex items-center justify-center text-[9px] transition-all ${
          isLight ? "left-[18px] bg-[#f59e0b]" : "left-[2px] bg-[#3d4d5c]"
        }`}
      >
        {isLight ? "☀" : "☾"}
      </span>
    </button>
  );
}
