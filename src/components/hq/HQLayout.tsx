import { useCallback, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import sidebarWave from "../../assets/images/sidebar-wave.png";
import { DashboardIcon, SiteManageIcon, ContactIcon, PrintIcon, DefaultProfileAvatar } from "../icons/Icons";
import { usePolling } from "../../shared/hooks/usePolling";
import { hqApi } from "../../api";
import { useHqMe } from "../../hooks/useHqMe";

const NAV_ITEMS = [
  { label: "대시보드", Icon: DashboardIcon, to: "/hq/dashboard" },
  { label: "현장 관리", Icon: SiteManageIcon, to: "/hq/sites" },
  { label: "전체 기록", Icon: PrintIcon, to: "/hq/records" },
  { label: "문의하기", Icon: ContactIcon, to: "/hq/contact" },
];

/** 현장 관리자 화면과 같은 사이드바 (브랜드 · 메뉴 · 흐르는 물결 · 사용자) */
function HQSidebar() {
  const location = useLocation();
  const me = useHqMe();
  const [emergencyCount, setEmergencyCount] = useState(0);

  // 긴급호출은 회사 범위 폴링으로 확인한다. 실패해도 화면은 유지한다.
  const poll = useCallback(async () => {
    try {
      setEmergencyCount((await hqApi.listActiveEmergencyCalls()).length);
    } catch {
      /* 다음 주기에 다시 시도 */
    }
  }, []);
  usePolling(poll, 10_000, 60_000);

  return (
    <aside
      data-name="HQSidebar"
      className="relative flex h-full w-[208px] shrink-0 flex-col overflow-hidden border-r border-solid border-[var(--color-border)] bg-[var(--home-sidebar-bg)]"
    >
      <div className="relative z-10 flex w-full flex-col items-start border-b border-solid border-[var(--color-border)] p-5">
        <div className="flex w-full items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--home-nav-active-bg)]">
            <img alt="폭염가드 로고" className="size-8 object-cover" src={logo} />
          </div>
          <p className="whitespace-nowrap text-base font-semibold leading-6 text-[var(--color-text-heading)]">폭염가드</p>
        </div>
      </div>

      <nav className="relative z-10 flex w-full flex-col gap-0.5 px-3 py-4">
        {NAV_ITEMS.map(({ label, Icon, to }) => {
          const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <Link
              key={label}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`flex w-[183px] items-center gap-2.5 rounded px-3 py-2 text-left transition-colors ${
                active
                  ? "bg-[var(--home-nav-active-bg)] text-[var(--home-nav-active-fg)]"
                  : "text-[var(--color-text-body)] hover:bg-[var(--home-nav-active-bg)]"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="whitespace-nowrap text-sm leading-5">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* 하단 파란 물결: 겹친 두 층이 서로 다른 속도로 천천히 흘러 유동적으로 보인다 */}
      <img
        src={sidebarWave}
        alt=""
        aria-hidden="true"
        className="sidebar-wave sidebar-wave-b pointer-events-none absolute -left-4 bottom-0 z-0 h-auto w-[calc(100%+32px)] max-w-none select-none"
      />
      <img
        src={sidebarWave}
        alt=""
        aria-hidden="true"
        className="sidebar-wave sidebar-wave-a pointer-events-none absolute -left-2 bottom-0 z-0 h-auto w-[calc(100%+16px)] max-w-none select-none"
      />

      <p className="relative z-10 select-none whitespace-pre-line px-5 pb-5 text-[10px] leading-[1.4] text-[var(--home-tagline)]">
        {"Safer\nWorkplaces\nBrighter Tomorrows"}
      </p>

      <div className="relative z-10 flex w-full flex-col items-start border-t border-solid border-[var(--color-border)] p-4">
        {emergencyCount > 0 && (
          <Link
            to="/hq/dashboard"
            className="mb-3 w-full rounded border border-[var(--color-danger-border)] bg-[var(--color-danger-soft-bg)] px-3 py-2 text-center text-[11px] font-medium leading-[16.5px] text-[var(--color-danger-text)]"
          >
            긴급호출 {emergencyCount}건
          </Link>
        )}
        <div className="flex w-full items-center gap-1">
          <Link
            to="/hq/account"
            title="계정 설정"
            className="flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1.5 text-left transition-colors hover:bg-[var(--home-nav-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          >
            <DefaultProfileAvatar className="size-8 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-xs leading-4 text-[var(--color-text-body)]">{me ? `${me.user.name} 님` : " "}</p>
              <p className="truncate pt-px text-[11px] leading-[16.5px] text-[var(--color-text-faint)]">{me?.company.companyName ?? " "}</p>
            </div>
          </Link>
          <Link
            to="/hq/account"
            aria-label="계정 설정"
            title="계정 설정"
            className="flex size-8 shrink-0 items-center justify-center rounded text-[var(--color-text-faint)] transition-colors hover:bg-[var(--home-nav-active-bg)] hover:text-[var(--color-text-heading)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-[18px]">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 1.72l-.08.57a2 2 0 0 1-1.18 1.55l-.53.27a2 2 0 0 1-1.93-.1l-.48-.29a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.48.29a2 2 0 0 1 .97 1.67v.54a2 2 0 0 1-.97 1.67l-.48.29a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.48-.29a2 2 0 0 1 1.93-.1l.53.27a2 2 0 0 1 1.18 1.55l.08.57a2 2 0 0 0 2 1.72h.44a2 2 0 0 0 2-1.72l.08-.57a2 2 0 0 1 1.18-1.55l.53-.27a2 2 0 0 1 1.93.1l.48.29a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.48-.29a2 2 0 0 1-.97-1.67v-.54a2 2 0 0 1 .97-1.67l.48-.29a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.48.29a2 2 0 0 1-1.93-.1l-.53-.27a2 2 0 0 1-1.18-1.55l-.08-.57a2 2 0 0 0-2-1.72Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default function HQLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[var(--home-main-bg)] text-[var(--color-text-body)]">
      <HQSidebar />
      <main className="h-full min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

export function HQContent({
  children,
  narrow = false,
  maxWidth,
}: {
  children: ReactNode;
  narrow?: boolean;
  /** 지정하면 본문 최대 너비(px)를 직접 정한다 */
  maxWidth?: number;
}) {
  const width = maxWidth ?? (narrow ? 448 : 1024);
  return (
    <div className="mx-auto w-full p-8" style={{ maxWidth: width + 64 }}>
      {children}
    </div>
  );
}
