import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import HomeSidebar from "./HomeSidebar";
import { EmergencyWatcher } from "./EmergencyWatcher";
import ConnectionBanner from "../../shared/ui/ConnectionBanner";
import MobileTopBar from "../../shared/ui/MobileTopBar";
import logo from "../../assets/images/logo.png";

export default function HomeLayout({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // 화면을 이동하면 모바일 메뉴를 닫는다.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <EmergencyWatcher>
      <div className="bg-[var(--home-main-bg)] flex h-screen w-full overflow-hidden">
        <div className="hidden md:flex h-full">
          <HomeSidebar />
        </div>
        <div className="flex-1 min-w-0 h-full flex flex-col">
          <MobileTopBar logo={logo} subtitle="현장" open={navOpen} onToggle={() => setNavOpen((v) => !v)} />
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[1600px] w-full mx-auto p-4 md:p-8 flex flex-col items-center">{children}</div>
          </div>
        </div>
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-label="메뉴">
          <button type="button" aria-label="메뉴 닫기" className="absolute inset-0 bg-black/50 animate-[fadeIn_0.15s_ease-out]" onClick={() => setNavOpen(false)} />
          <div className="relative h-full w-[208px] shadow-2xl">
            <HomeSidebar />
          </div>
        </div>
      )}
      <ConnectionBanner />
    </EmergencyWatcher>
  );
}
