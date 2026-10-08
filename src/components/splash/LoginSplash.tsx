import { useEffect, useState, type ReactNode } from "react";
import logo from "../../assets/images/logo.png";

/** 스플래시를 완전히 보여주는 시간 */
const SHOW_MS = 2000;
/** 사라지는(페이드아웃) 시간 */
const FADE_MS = 600;

type Phase = "idle" | "show" | "fade";

/**
 * 웹에 들어올 때(첫 로드·새로고침)마다 스플래시를 보여준다.
 * 처음부터 화면 전체를 덮고 있다가 2초 뒤 페이드아웃되며 그 아래의 화면이 자연스럽게 드러난다.
 */
export function SplashProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("show");

  useEffect(() => {
    if (phase === "show") {
      const t = window.setTimeout(() => setPhase("fade"), SHOW_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === "fade") {
      const t = window.setTimeout(() => setPhase("idle"), FADE_MS);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  return (
    <>
      {children}
      {phase !== "idle" && <SplashOverlay fading={phase === "fade"} />}
    </>
  );
}

function SplashOverlay({ fading }: { fading: boolean }) {
  const blob = "pointer-events-none absolute rounded-[50%] blur-[70px]";
  return (
    <div
      role="status"
      aria-label="폭염가드 로딩 중"
      className="splash-anim fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: "var(--splash-bg)",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div className={`${blob} -bottom-[18%] -left-[8%] h-[40%] w-[34%]`} style={{ background: "var(--splash-blob-blue)" }} />
      <div className={`${blob} -bottom-[14%] -right-[6%] h-[36%] w-[30%]`} style={{ background: "var(--splash-blob-warm)" }} />

      <div
        className="splash-anim relative flex flex-col items-center gap-5"
        style={{
          transform: fading ? "translateY(-6px) scale(1.03)" : undefined,
          transition: `transform ${FADE_MS}ms ease`,
          animation: "splash-pop 700ms cubic-bezier(0.22, 1, 0.36, 1) 100ms both",
        }}
      >
        <img alt="" src={logo} className="size-28 object-contain" draggable={false} />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[32px] font-bold leading-[1.4]" style={{ color: "var(--splash-title)" }}>
            폭염가드
          </p>
          <p className="text-[15px] leading-[1.5]" style={{ color: "var(--splash-sub)" }}>
            폭염 속 현장의 안전을 지키는
            <br />
            가장 빠른 방법
          </p>
        </div>
      </div>
    </div>
  );
}
