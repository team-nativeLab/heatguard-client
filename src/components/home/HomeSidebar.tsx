import type { ComponentType } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { DashboardIcon, SiteManageIcon, AccountIcon, ContactIcon } from "../icons/Icons";
import { useToast } from "../ui/Toast";
import { useSiteMe } from "../../hooks/useSiteMe";
import { authApi, isNetworkError } from "../../api";

type NavItem = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  to?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "대시보드", Icon: DashboardIcon, to: "/manager" },
  { label: "현장 관리", Icon: SiteManageIcon, to: "/manager/sites" },
  { label: "계정 설정", Icon: AccountIcon, to: "/manager/account" },
  { label: "문의하기", Icon: ContactIcon, to: "/manager/contact" },
];

export default function HomeSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const me = useSiteMe();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      if (!isNetworkError(err)) {

        console.warn("로그아웃 요청이 실패했어요.", err);
      }
    } finally {
      navigate("/auth/login");
    }
  };

  return (
    <aside
      data-name="HomeSidebar"
      className="bg-[var(--home-sidebar-bg)] border-[var(--color-border)] border-r border-solid flex flex-col h-full shrink-0 w-[208px] overflow-hidden"
    >
      <div className="border-[var(--color-border)] border-b border-solid flex flex-col items-start p-5 w-full">
        <div className="flex gap-2.5 items-center w-full">
          <div className="bg-[var(--home-nav-active-bg)] flex items-center justify-center rounded shrink-0 size-6 overflow-hidden">
            <img alt="폭염가드 로고" className="size-6 object-cover" src={logo} />
          </div>
          <p className="font-semibold leading-5 text-sm text-[var(--color-text-heading)] whitespace-nowrap">폭염가드</p>
        </div>
        <p className="font-['JetBrains_Mono',monospace] leading-[15px] pl-8 pt-0.5 text-[var(--color-text-body)] text-[10px] tracking-[0.5px] whitespace-nowrap">
          현장 안전을 더 가깝게
        </p>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 py-4 w-full">
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

      {}
      <p className="px-5 pb-5 text-[10px] leading-[1.4] text-[var(--home-tagline)] whitespace-pre-line select-none">
        {"Safer\nWorkplaces\nBrighter Tomorrows"}
      </p>

      <div className="bg-[var(--home-sidebar-bg)] border-[var(--color-border)] border-solid border-t flex flex-col items-start p-4 w-full">
        <div className="flex gap-2 items-center w-full">
          <span className="bg-[var(--home-avatar-bg)] rounded-full shrink-0 size-8" aria-hidden="true" />
          <div className="flex flex-col min-w-0">
            <p className="leading-4 text-[var(--color-text-body)] text-xs">{me.user.name} 님</p>
            <p className="leading-[16.5px] text-[var(--color-text-faint)] text-[11px] pt-px truncate">{me.site.name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="leading-[16.5px] text-[var(--color-text-faint)] text-[11px] pt-2 hover:text-[var(--color-text-body)] transition-colors"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
