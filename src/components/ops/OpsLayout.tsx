import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { ContactIcon, DefaultProfileAvatar } from "../icons/Icons";
import { opsApi, type OpsUser } from "../../api";
import { markSignedOut } from "../../shared/auth/authScope";
import { useToast } from "../../shared/ui/toastContext";

/*
 * 운영자 콘솔 사이드바.
 * Figma에는 대시보드·집계·회원 관리·가입 승인·활동 로그·시스템 설정도 있지만
 * 서버 API가 아직 없어 동작하지 않는 메뉴는 노출하지 않는다.
 */
const NAV_ITEMS = [{ label: "민원 처리", Icon: ContactIcon, to: "/ops/inquiries" }];

function OpsSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [me, setMe] = useState<OpsUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let alive = true;
    opsApi.me().then((user) => alive && setMe(user)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await opsApi.logout();
    } catch {
      // 서버 세션 정리에 실패해도 화면에서는 로그아웃 처리한다.
    }
    markSignedOut("ops");
    showToast("로그아웃했어요.");
    navigate("/ops/login", { replace: true });
  };

  return (
    <aside className="relative flex h-full w-[208px] shrink-0 flex-col overflow-hidden border-r border-solid border-[var(--color-border)] bg-[var(--home-sidebar-bg)]">
      <div className="flex w-full items-center gap-2.5 border-b border-solid border-[var(--color-border)] p-5">
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--home-nav-active-bg)]">
          <img alt="폭염가드 로고" className="size-8 object-cover" src={logo} />
        </div>
        <p className="whitespace-nowrap text-base font-semibold leading-6 text-[var(--color-text-heading)]">폭염가드 관리자</p>
      </div>

      <p className="px-6 pt-4 text-[11px] font-medium tracking-wide text-[var(--color-text-faint)]">MENU</p>
      <nav className="flex w-full flex-col gap-0.5 px-3 py-2">
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

      <div className="flex w-full flex-col gap-2 border-t border-solid border-[var(--color-border)] p-4">
        <div className="flex min-w-0 items-center gap-2 px-1.5">
          <DefaultProfileAvatar className="size-8 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-xs leading-4 text-[var(--color-text-body)]">{me ? `${me.name} 님` : " "}</p>
            <p className="truncate pt-px text-[11px] leading-[16.5px] text-[var(--color-text-faint)]">{me?.email ?? "운영자"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loggingOut}
          className="w-full rounded px-3 py-2 text-left text-sm text-[var(--color-text-body)] transition-colors hover:bg-[var(--home-nav-active-bg)] disabled:opacity-60"
        >
          {loggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>
      </div>
    </aside>
  );
}

export default function OpsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[var(--home-main-bg)] text-[var(--color-text-body)]">
      <OpsSidebar />
      <main className="h-full min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
