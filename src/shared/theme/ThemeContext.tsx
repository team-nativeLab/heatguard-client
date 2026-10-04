// ⚠️ 자동 생성 파일 — heatguard-shared/src 에서 수정한 뒤 `node sync.mjs`로 반영하세요.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "heatguard-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "light";
  } catch {
    return "light";
  }
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme은 ThemeProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/**
 * 테마를 한 번에 바꾼다.
 * 요소마다 transition 시간이 달라 색이 순서대로 바뀌어 보이는 문제를 막기 위해
 * - View Transitions API가 있으면 화면 전체를 한 장면으로 크로스페이드하고
 * - 없으면 전환 순간에만 모든 transition을 꺼서 즉시 바꾼다.
 */
function applyThemeAtOnce(update: () => void) {
  const doc = document as ViewTransitionDocument;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (doc.startViewTransition && !reduceMotion) {
    doc.startViewTransition(() => flushSync(update));
    return;
  }

  const root = document.documentElement;
  root.classList.add("theme-switching");
  flushSync(update);
  // 스타일 계산을 강제로 끝낸 뒤 transition을 다시 켠다.
  void root.offsetHeight;
  requestAnimationFrame(() => root.classList.remove("theme-switching"));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // 저장이 막힌 환경(시크릿 모드 등)에서는 이번 세션에만 적용
    }
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyThemeAtOnce(() => {
      document.documentElement.setAttribute("data-theme", next);
      setTheme(next);
    });
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
