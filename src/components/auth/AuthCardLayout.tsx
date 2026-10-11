import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import AuthThemeButton from "./AuthThemeButton";

export interface AuthFeature {
  icon: ReactNode;
  /** 아이콘 타일 배경: blue = 파랑, orange = 주황 */
  tone: "blue" | "orange";
  title: string;
  description: string;
}

export type AuthSide = "login" | "signup";

interface AuthCardLayoutProps {
  /** login = 카드가 오른쪽, signup = 카드가 왼쪽(소개 패널은 오른쪽) */
  side?: AuthSide;
  eyebrow: string;
  titleLines: string[];
  descriptionLines: string[];
  features: AuthFeature[];
  /** 좌측 패널 하단 페이지네이션 (1부터) */
  step: number;
  stepTotal?: number;
  footerLabel?: string;
  cardTitle: string;
  cardSubtitle: string;
  children: ReactNode;
}

/** 배경에 깔리는 은은한 컬러 글로우 (Figma Ellipse 4종) */
function Glows() {
  const base = "absolute rounded-[50%] blur-[60px]";
  return (
    <div aria-hidden="true" className="auth-glows pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`${base} -left-[10%] bottom-[-14%] h-[50%] w-[46%]`} style={{ background: "var(--auth-glow-blue)" }} />
      <div className={`${base} left-[36%] bottom-[2%] h-[40%] w-[32%]`} style={{ background: "var(--auth-glow-warm)" }} />
      <div className={`${base} left-[44%] bottom-[-16%] h-[42%] w-[38%]`} style={{ background: "var(--auth-glow-blue)" }} />
      <div className={`${base} -top-[16%] right-[-4%] h-[34%] w-[34%]`} style={{ background: "var(--auth-glow-blue)" }} />
    </div>
  );
}

/**
 * 본사 로그인·회원가입 공통 레이아웃 (Figma 01_본사_로그인 / 02_본사_회원가입)
 * 좌측 소개 패널(600×673) 위로 우측 카드(500×673)가 50px 겹쳐지는 구조.
 * lg 미만에서는 소개 패널을 숨기고 카드만 보여준다.
 */
export default function AuthCardLayout({
  side = "login",
  eyebrow,
  titleLines,
  descriptionLines,
  features,
  step,
  stepTotal = 3,
  footerLabel = "폭염가드 본사 포털",
  cardTitle,
  cardSubtitle,
  children,
}: AuthCardLayoutProps) {
  // 로그인 ↔ 회원가입 이동 시: 이전 화면의 위치에서 시작해 새 위치로 카드가 미끄러진다.
  const location = useLocation();
  const from = (location.state as { authFrom?: AuthSide } | null)?.authFrom;
  const [settled, setSettled] = useState(!from || from === side);
  useEffect(() => {
    if (settled) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setSettled(true)));
    return () => cancelAnimationFrame(id);
  }, [settled]);
  const shown: AuthSide = settled ? side : (from ?? side);
  const slide = "transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

  return (
    <div className="auth-bg relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[var(--auth-page-bg)] px-4 py-8 lg:p-12">
      <Glows />

      <div className="relative z-10 flex w-full max-w-[1050px] items-stretch justify-center">
        {/* 좌측 소개 패널 */}
        <aside
          className={`relative hidden h-[673px] w-[600px] shrink-0 overflow-hidden rounded-[28px] border backdrop-blur-xl lg:block ${slide} ${shown === "signup" ? "lg:translate-x-[450px]" : ""}`}
          style={{
            background: "var(--auth-panel-bg)",
            borderColor: "var(--auth-panel-border)",
            boxShadow: "var(--auth-panel-shadow)",
          }}
        >
          <div className={`absolute top-[35px] flex items-center gap-2.5 ${shown === "signup" ? "left-[95px]" : "left-[45px]"}`}>
            <img alt="" src={logo} className="size-[30px] object-contain" />
            <p className="text-[20px] font-bold leading-[1.4] text-[var(--auth-text-strong)]">폭염가드</p>
          </div>

          <div className={`auth-fade-in absolute bottom-[76px] top-[120px] flex flex-col justify-center gap-[38px] ${shown === "signup" ? "left-[95px] right-[45px]" : "inset-x-[45px]"}`}>
            <div className="flex flex-col gap-2.5">
              <p className="text-[15px] font-medium leading-[1.4] text-[var(--auth-accent)]">{eyebrow}</p>
              <h2 className="text-[32px] font-bold leading-[1.35] text-[var(--auth-text-strong)]">
                {titleLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
              <p className="text-[15px] leading-[1.55] text-[var(--auth-text-body)]">
                {descriptionLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>

            <ul className={`flex flex-col ${features.length > 2 ? "gap-5" : "gap-7"}`}>
              {features.map((f) => (
                <li key={f.title} className="flex items-center gap-5">
                  <div
                    className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px]"
                    style={{
                      background: f.tone === "blue" ? "var(--auth-tile-blue-bg)" : "var(--auth-tile-orange-bg)",
                      color: f.tone === "blue" ? "#2f86f6" : "#ff7a3d",
                    }}
                  >
                    {f.icon}
                  </div>
                  <div className="flex flex-col gap-1 leading-[1.4]">
                    <p className="text-[15px] font-bold text-[var(--auth-text-strong)]">{f.title}</p>
                    <p className="text-[13px] text-[var(--auth-text-body)]">{f.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className={`absolute bottom-[38px] flex items-center gap-2 ${shown === "signup" ? "left-[95px]" : "left-[45px]"}`}>
            {Array.from({ length: stepTotal }, (_, i) => (
              <span
                key={i}
                className="h-[3px] w-6 rounded-[2px]"
                style={{ background: i + 1 === step ? "var(--auth-accent)" : "var(--auth-dot-off)" }}
              />
            ))}
            <span className="w-1.5" />
            <span className="text-xs leading-[1.4] text-[var(--auth-text-muted)]">{String(step).padStart(2, "0")}</span>
            <span className="text-xs leading-[1.4] text-[var(--auth-text-muted)]">{footerLabel}</span>
          </div>
        </aside>

        {/* 우측 카드 */}
        <main
          className={`relative z-10 flex min-h-[673px] w-full max-w-[500px] flex-col justify-center rounded-[28px] border px-6 pb-8 pt-14 sm:px-14 lg:-ml-[50px] ${slide} ${shown === "signup" ? "lg:-translate-x-[550px]" : ""}`}
          style={{
            background: "var(--auth-card-bg)",
            borderColor: "var(--auth-card-border)",
            boxShadow: "var(--auth-card-shadow)",
          }}
        >
          <AuthThemeButton className="absolute right-7 top-7" />

          <div className="auth-fade-in mx-auto w-full max-w-[388px]">
            <div className="flex items-center gap-3.5">
              <img alt="폭염가드 로고" src={logo} className="size-10 shrink-0 object-contain" />
              <div className="flex flex-col gap-0.5 leading-[1.4]">
                <h1 className="text-[24px] font-bold text-[var(--auth-text-strong)]">{cardTitle}</h1>
                <p className="text-sm text-[var(--auth-text-body)]">{cardSubtitle}</p>
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
