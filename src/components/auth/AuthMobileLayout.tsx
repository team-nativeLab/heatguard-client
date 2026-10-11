import type { ReactNode } from "react";
import AuthMobileThemeButton from "./AuthMobileThemeButton";

/**
 * 현장 앱 로그인·회원가입 공통 프레임 (Figma 로그인 — 앱 / 회원가입 — 앱, 402×874)
 * 모바일에서는 화면 전체를, 데스크톱에서는 가운데 402px 카드로 보여준다.
 */
export default function AuthMobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh w-full justify-center bg-[var(--auth-m-page-bg)] sm:items-center sm:px-4 sm:py-8">
      <div className="relative flex min-h-svh w-full max-w-[402px] flex-col bg-[var(--auth-m-surface)] sm:min-h-[874px] sm:rounded-[32px] sm:shadow-[0_16px_48px_rgba(51,77,128,0.12)]">
        <AuthMobileThemeButton className="absolute right-4 top-4 z-10" />
        {children}
      </div>
    </div>
  );
}
