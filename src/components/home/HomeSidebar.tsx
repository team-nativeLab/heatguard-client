import { useEffect, useState, type ComponentType } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import sidebarWave from "../../assets/images/sidebar-wave.png";
import { DashboardIcon, SiteManageIcon, ContactIcon, DefaultProfileAvatar } from "../icons/Icons";
import { useToast } from "../../shared/ui/Toast";
import { useSiteMe } from "../../hooks/useSiteMe";
import { authApi, type ManagedSite } from "../../api";
import { getSelectedSiteId, setSelectedSiteId, SITE_SELECTION_EVENT } from "../../lib/siteSelection";

type NavItem = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  to?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "대시보드", Icon: DashboardIcon, to: "/manager" },
  { label: "현장 관리", Icon: SiteManageIcon, to: "/manager/sites" },
  { label: "문의하기", Icon: ContactIcon, to: "/manager/contact" },
];

export default function HomeSidebar() {
  const location = useLocation();
  const { showToast } = useToast();
  const me = useSiteMe();
  const [managedSites, setManagedSites] = useState<ManagedSite[]>([]);
  const [selectedSiteId, setSelectedId] = useState(getSelectedSiteId());
  const accountActive = location.pathname.startsWith("/manager/account");

  useEffect(() => {
    let alive = true;
    authApi.listManagedSites().then((items) => {
      if (alive) setManagedSites(items);
    }).catch(() => { /* 상단 현장 전환을 사용할 수 없는 경우 기존 소속 표기를 유지한다. */ });
    const onSelection = (event: Event) => setSelectedId((event as CustomEvent<{ siteId: string }>).detail.siteId);
    window.addEventListener(SITE_SELECTION_EVENT, onSelection);
    return () => {
      alive = false;
      window.removeEventListener(SITE_SELECTION_EVENT, onSelection);
    };
  }, []);

  return (
    <aside
      data-name="HomeSidebar"
      className="relative bg-[var(--home-sidebar-bg)] border-[var(--color-border)] border-r border-solid flex flex-col h-full shrink-0 w-[208px] overflow-hidden"
    >
      <div className="relative z-10 border-[var(--color-border)] border-b border-solid flex flex-col items-start p-5 w-full">
        <div className="flex gap-2.5 items-center w-full">
          <div className="bg-[var(--home-nav-active-bg)] flex items-center justify-center rounded shrink-0 size-8 overflow-hidden">
            <img alt="폭염가드 로고" className="size-8 object-cover" src={logo} />
          </div>
          <p className="font-semibold leading-6 text-base text-[var(--color-text-heading)] whitespace-nowrap">폭염가드</p>
        </div>
        {managedSites.length > 1 ? (
          <label className="mt-2 block w-full pl-8">
            <span className="sr-only">관리할 현장 선택</span>
            <select
              aria-label="관리할 현장 선택"
              value={selectedSiteId}
              onChange={(event) => {
                const siteId = event.target.value;
                setSelectedSiteId(siteId);
                window.location.reload();
              }}
              className="w-full cursor-pointer truncate rounded-md border border-[var(--color-border)] bg-[var(--home-sidebar-bg)] px-2 py-1 text-[11px] text-[var(--color-text-body)] outline-none focus:border-[var(--color-accent)]"
            >
              {managedSites.map((site) => <option key={site.siteId} value={site.siteId}>{site.siteName}</option>)}
            </select>
          </label>
        ) : null}
      </div>

      <nav className="relative z-10 flex flex-col gap-0.5 px-3 py-4 w-full">
        {NAV_ITEMS.map(({ label, Icon, to }) => {
          const active = to
            ? to === "/manager"
              ? location.pathname === "/manager"
              : location.pathname.startsWith(to)
            : false;
          const cls = `flex gap-2.5 items-center px-3 py-2 rounded w-[183px] text-left transition-colors ${
            active
              ? "bg-[var(--home-nav-active-bg)] text-[var(--home-nav-active-fg)]"
              : "text-[var(--color-text-body)] hover:bg-[var(--home-nav-active-bg)]"
          }`;
          const content = (
            <>
              <Icon className="size-4 shrink-0" />
              <span className="leading-5 text-sm whitespace-nowrap">{label}</span>
            </>
          );
          return to ? (
            <Link key={label} to={to} className={cls} aria-current={active ? "page" : undefined}>
              {content}
            </Link>
          ) : (
            <button key={label} type="button" className={cls} onClick={() => showToast(`${label} 화면은 준비 중이에요.`)}>
              {content}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* 하단 파란 물결: 겹친 두 층이 서로 다른 속도로 천천히 흘러 유동적으로 보인다 */}
      <img
        src={sidebarWave}
        alt=""
        aria-hidden="true"
        className="sidebar-wave sidebar-wave-b pointer-events-none absolute -left-4 bottom-0 z-0 w-[calc(100%+32px)] max-w-none h-auto select-none"
      />
      <img
        src={sidebarWave}
        alt=""
        aria-hidden="true"
        className="sidebar-wave sidebar-wave-a pointer-events-none absolute -left-2 bottom-0 z-0 w-[calc(100%+16px)] max-w-none h-auto select-none"
      />

      <p className="relative z-10 px-5 pb-5 text-[10px] leading-[1.4] text-[var(--home-tagline)] whitespace-pre-line select-none">
        {"Safer\nWorkplaces\nBrighter Tomorrows"}
      </p>

      <div className="relative z-10 border-[var(--color-border)] border-solid border-t flex flex-col items-start p-4 w-full">
        <Link
          to="/manager/account"
          aria-current={accountActive ? "page" : undefined}
          title="계정 설정"
          className="flex gap-2 items-center w-full rounded px-1.5 py-1.5 -mx-1.5 transition-colors hover:bg-[var(--home-nav-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
        >
          <DefaultProfileAvatar className="shrink-0 size-8" />
          <div className="flex flex-col min-w-0 flex-1">
            <p className="leading-4 text-[var(--color-text-body)] text-xs">{me.user.name} 님</p>
            <p className="leading-[16.5px] text-[var(--color-text-faint)] text-[11px] pt-px truncate">{me.site.name}</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 shrink-0 text-[var(--color-text-faint)]">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.08-.03a1.7 1.7 0 0 0-1.78.25l-.07.05h-3.4l-.02-.09a1.7 1.7 0 0 0-1.24-1.3l-.09-.02-1.7-2.94.06-.06A1.7 1.7 0 0 0 10 14l-.02-.09V10.5l.09-.02a1.7 1.7 0 0 0 1.3-1.24l.02-.09 2.94-1.7.06.06a1.7 1.7 0 0 0 1.88.34l.06-.03 2.94 1.7-.03.08a1.7 1.7 0 0 0 .25 1.78l.05.07v3.4l-.09.02A1.7 1.7 0 0 0 19.4 15Z" transform="translate(-2 -1) scale(1.15)" />
          </svg>
        </Link>

      </div>

    </aside>
  );
}

