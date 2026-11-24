import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import OpsIcon, { type OpsIconName } from "./OpsIcon";
import { opsApi, type OpsUser } from "../../api";
import { markSignedOut } from "../../shared/auth/authScope";
import { useToast } from "../../shared/ui/toastContext";

/*
 * 운영자 콘솔 공통 틀 (Figma 운영자 콘솔: Sidebar + 상단 바).
 * 메뉴는 Figma와 같은 7개를 보여주되, 서버 API가 없는 메뉴(회원 관리·가입 승인·활동 로그)는 비활성으로 둔다.
 */
interface NavItem {
  label: string;
  icon: OpsIconName;
  to?: string;
  badge?: "openInquiries";
}

const NAV_ITEMS: NavItem[] = [
  { label: "대시보드", icon: "home", to: "/ops/dashboard" },
  { label: "집계 페이지", icon: "chart", to: "/ops/stats" },
  { label: "회원 관리", icon: "users" },
  { label: "가입 승인", icon: "userCheck" },
  { label: "활동 로그", icon: "activity" },
  { label: "민원 처리", icon: "message", to: "/ops/inquiries", badge: "openInquiries" },
  { label: "시스템 설정", icon: "settings", to: "/ops/settings" },
];

function useOpsLogout() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);
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
  return { logout, loggingOut };
}

function OpsSidebar({ openInquiries }: { openInquiries?: number | null }) {
  const location = useLocation();
  const { showToast } = useToast();
  const { logout, loggingOut } = useOpsLogout();

  const itemClass = (active: boolean, disabled = false) =>
    `flex h-10 w-full items-center gap-3 rounded-[10px] px-4 text-left text-sm transition-colors ${
      active
        ? "bg-[var(--ops-accent-soft)] font-bold text-[var(--ops-accent)]"
        : disabled
          ? "cursor-not-allowed font-medium text-[var(--ops-body)] opacity-45"
          : "font-medium text-[var(--ops-body)] hover:bg-[var(--ops-chip-bg)]"
    }`;

  return (
    <aside className="flex h-full w-[68px] shrink-0 md:w-[232px] flex-col border-r border-[var(--ops-border)] bg-[var(--ops-surface)]">
      <div className="flex items-center gap-2.5 px-[18px] pt-6 md:px-6">
        <img alt="" className="size-8 rounded-[9px] object-cover" src={logo} />
        <p className="hidden whitespace-nowrap text-base font-bold text-[var(--ops-heading)] md:block">폭염가드 관리자</p>
      </div>

      <p className="hidden px-6 pb-2 pt-6 text-[11px] md:block font-medium tracking-[0.06em] text-[var(--ops-faint)]">MENU</p>
      <nav aria-label="운영자 메뉴" className="flex flex-col gap-1 px-2 pt-6 md:px-3 md:pt-0">
        {NAV_ITEMS.map((item) => {
          const badge = item.badge === "openInquiries" && openInquiries ? openInquiries : null;
          const content = (
            <>
              <OpsIcon name={item.icon} size={18} />
              <span className="hidden flex-1 whitespace-nowrap md:block">{item.label}</span>
              {badge != null && (
                <span className="hidden rounded-full bg-[var(--ops-accent)] px-[7px] py-px text-[11px] font-bold text-white md:inline">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </>
          );
          if (!item.to) {
            return (
              <button
                key={item.label}
                type="button"
                aria-disabled="true"
                title="준비 중인 기능이에요"
                aria-label={item.label}
                onClick={() => showToast(`${item.label} · 준비 중인 기능이에요.`)}
                className={itemClass(false, true)}
              >
                {content}
              </button>
            );
          }
          const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <Link key={item.label} to={item.to} aria-label={item.label} title={item.label} aria-current={active ? "page" : undefined} className={itemClass(active)}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-[var(--ops-border)] px-2 py-4 md:px-3">
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loggingOut}
          aria-label="로그아웃"
          className="flex h-10 w-full items-center gap-3 rounded-[10px] px-4 text-sm font-medium text-[var(--ops-body)] transition-colors hover:bg-[var(--ops-chip-bg)] disabled:opacity-60"
        >
          <OpsIcon name="logout" size={18} />
          <span className="hidden md:inline">{loggingOut ? "로그아웃 중..." : "로그아웃"}</span>
        </button>
      </div>
    </aside>
  );
}

function OpsTopBar() {
  const [me, setMe] = useState<OpsUser | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { logout, loggingOut } = useOpsLogout();

  useEffect(() => {
    let alive = true;
    opsApi.me().then((user) => alive && setMe(user)).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <header className="flex h-20 shrink-0 items-center justify-end px-4 md:px-8">
      <div ref={ref} className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 text-sm font-medium text-[var(--ops-heading)] transition-colors hover:bg-[var(--ops-chip-bg)]"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-[var(--ops-chip-bg)] text-[var(--ops-body)]">
            <OpsIcon name="user" />
          </span>
          <span className="max-w-[160px] truncate">{me?.name ?? "운영자"}</span>
          <OpsIcon name="chevDown" className="text-[var(--ops-body)]" />
        </button>
        {open && (
          <div role="menu" className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-[var(--ops-border)] bg-[var(--ops-surface)] p-2 shadow-lg">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium text-[var(--ops-heading)]">{me?.name ?? "운영자"}</p>
              <p className="truncate text-xs text-[var(--ops-faint)]">{me?.email ?? ""}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => void logout()}
              disabled={loggingOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--ops-body)] hover:bg-[var(--ops-chip-bg)] disabled:opacity-60"
            >
              <OpsIcon name="logout" />
              {loggingOut ? "로그아웃 중..." : "로그아웃"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/** Figma 페이지 머리말: 작은 경로 → 제목(26px) → 설명, 오른쪽에 버튼 */
export function OpsPageHeader({ crumb, title, description, actions }: {
  crumb: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col">
        <p className="text-xs font-medium text-[var(--ops-faint)]">{crumb}</p>
        <h1 className="mt-1 text-[26px] font-bold leading-[1.4] text-[var(--ops-heading)]">{title}</h1>
        <p className="mt-1 text-sm text-[var(--ops-body)]">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2 pt-5">{actions}</div>}
    </div>
  );
}

export default function OpsLayout({ children, openInquiries }: { children: ReactNode; openInquiries?: number | null }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--ops-bg)] text-[var(--ops-body)]">
      <OpsSidebar openInquiries={openInquiries} />
      <div className="flex min-w-0 flex-1 flex-col">
        <OpsTopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
