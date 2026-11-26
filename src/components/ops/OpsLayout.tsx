import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import OpsIcon, { type OpsIconName } from "./OpsIcon";
import { opsAdminApi, opsApi } from "../../api";
import { clearOpsMeCache, useOpsMe } from "../../hooks/useOpsMe";
import type { OpsNotification } from "../../lib/opsAdmin";
import { relativeTime } from "../../lib/opsInquiry";
import { usePolling } from "../../shared/hooks/usePolling";
import { markSignedOut } from "../../shared/auth/authScope";
import { useToast } from "../../shared/ui/toastContext";

/*
 * 운영자 콘솔 공통 틀 (Figma 운영자 콘솔: Sidebar + 상단 바).
 * 배지(미답변 문의·가입 승인 대기)는 여기서 1분마다 직접 센다. 화면이 더 최신 값을 알면 prop으로 덮어쓴다.
 * 가입 승인 API가 없는 서버에서는 그 배지만 빠진다.
 */
type BadgeKey = "openInquiries" | "pendingSignups";
type Badges = Partial<Record<BadgeKey, number | null>>;

interface NavItem {
  label: string;
  icon: OpsIconName;
  to: string;
  badge?: BadgeKey;
}

const NAV_ITEMS: NavItem[] = [
  { label: "대시보드", icon: "home", to: "/ops/dashboard" },
  { label: "집계 페이지", icon: "chart", to: "/ops/stats" },
  { label: "회원 관리", icon: "users", to: "/ops/members" },
  { label: "가입 승인", icon: "userCheck", to: "/ops/signups", badge: "pendingSignups" },
  { label: "활동 로그", icon: "activity", to: "/ops/activity" },
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
    clearOpsMeCache();
    showToast("로그아웃했어요.");
    navigate("/ops/login", { replace: true });
  };
  return { logout, loggingOut };
}

function useBadges(override: Badges): Badges {
  const [counts, setCounts] = useState<Badges>({});
  const load = useCallback(async () => {
    const [summary, signups] = await Promise.allSettled([
      opsApi.getDashboardSummary(30),
      opsAdminApi.listSignupRequests({ status: "PENDING_APPROVAL" }),
    ]);
    setCounts({
      openInquiries: summary.status === "fulfilled" && summary.value ? summary.value.openInquiries : null,
      pendingSignups: signups.status === "fulfilled" && signups.value ? signups.value.counts.PENDING_APPROVAL : null,
    });
  }, []);
  usePolling(load, 60_000, null);
  return {
    openInquiries: override.openInquiries ?? counts.openInquiries,
    pendingSignups: override.pendingSignups ?? counts.pendingSignups,
  };
}

function OpsSidebar({ badges }: { badges: Badges }) {
  const location = useLocation();
  const { logout, loggingOut } = useOpsLogout();

  const itemClass = (active: boolean) =>
    `flex h-10 w-full items-center gap-3 rounded-[10px] px-4 text-left text-sm transition-colors ${
      active ? "bg-[var(--ops-accent-soft)] font-bold text-[var(--ops-accent)]" : "font-medium text-[var(--ops-body)] hover:bg-[var(--ops-chip-bg)]"
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
          const badge = item.badge ? badges[item.badge] || null : null;
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

function OpsSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const keyword = q.trim();
    if (!keyword) return;
    navigate(`/ops/members?q=${encodeURIComponent(keyword)}`);
  };
  return (
    <form role="search" onSubmit={submit} className="relative hidden h-10 w-[372px] items-center lg:flex">
      <OpsIcon name="search" className="pointer-events-none absolute left-3.5 text-[var(--ops-faint)]" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="회사명, 담당자, 키워드 검색"
        aria-label="회원 검색"
        className="h-full w-full rounded-[10px] border border-[var(--ops-border)] bg-[var(--ops-surface)] pl-10 pr-3 text-[13px] text-[var(--ops-heading)] outline-none placeholder:text-[var(--ops-faint)] focus:border-[var(--ops-accent)]"
      />
    </form>
  );
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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
  return { open, setOpen, ref };
}

function OpsBell() {
  const navigate = useNavigate();
  const { open, setOpen, ref } = usePopover();
  // undefined: 불러오는 중, null: 서버에 알림 기능 없음
  const [data, setData] = useState<{ items: OpsNotification[]; unreadCount: number } | null | undefined>(undefined);
  const load = useCallback(async () => {
    try {
      setData(await opsAdminApi.listNotifications());
    } catch {
      // 알림은 부가 기능이라 실패해도 화면을 막지 않는다.
    }
  }, []);
  usePolling(load, 60_000, null);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && data?.unreadCount) {
      opsAdminApi.markNotificationsRead().then(() => setData((d) => (d ? { items: d.items.map((n) => ({ ...n, read: true })), unreadCount: 0 } : d))).catch(() => {});
    }
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={toggle} aria-haspopup="dialog" aria-expanded={open} aria-label={data?.unreadCount ? `알림 ${data.unreadCount}개` : "알림"} className="relative flex size-10 items-center justify-center rounded-full text-[var(--ops-body)] hover:bg-[var(--ops-chip-bg)]">
        <OpsIcon name="bell" size={20} />
        {!!data?.unreadCount && <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--color-danger-text)]" aria-hidden />}
      </button>
      {open && (
        <div role="dialog" aria-label="알림" className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-[var(--ops-border)] bg-[var(--ops-surface)] p-2 shadow-lg">
          <p className="px-3 py-2 text-sm font-bold text-[var(--ops-heading)]">알림</p>
          {data === null ? (
            <p className="px-3 py-6 text-center text-[13px] text-[var(--ops-faint)]">알림 기능은 서버 준비 중이에요.</p>
          ) : !data ? (
            <p className="px-3 py-6 text-center text-[13px] text-[var(--ops-faint)]">불러오는 중...</p>
          ) : data.items.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-[var(--ops-faint)]">새 알림이 없어요.</p>
          ) : (
            <ul className="flex max-h-80 flex-col overflow-y-auto">
              {data.items.map((n) => (
                <li key={n.notificationId}>
                  <button
                    type="button"
                    disabled={!n.link}
                    onClick={() => { if (n.link) { setOpen(false); navigate(n.link); } }}
                    className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left hover:bg-[var(--ops-chip-bg)] disabled:cursor-default"
                  >
                    <span className={`text-[13px] ${n.read ? "text-[var(--ops-body)]" : "font-medium text-[var(--ops-heading)]"}`}>{n.message}</span>
                    <span className="text-[11px] text-[var(--ops-faint)]">{relativeTime(n.at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function OpsTopBar() {
  const me = useOpsMe();
  const { open, setOpen, ref } = usePopover();
  const { logout, loggingOut } = useOpsLogout();

  return (
    <header className="flex h-20 shrink-0 items-center justify-end gap-4 px-4 md:px-8">
      <OpsSearch />
      <OpsBell />
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
          {/* 불러오기 전에는 더미 이름 대신 빈 자리만 둔다 */}
          {me ? (
            <span className="max-w-[160px] truncate">{me.name}</span>
          ) : (
            <span aria-label="불러오는 중" className="h-4 w-14 animate-pulse rounded bg-[var(--ops-chip-bg)]" />
          )}
          <OpsIcon name="chevDown" className="text-[var(--ops-body)]" />
        </button>
        {open && (
          <div role="menu" className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-[var(--ops-border)] bg-[var(--ops-surface)] p-2 shadow-lg">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium text-[var(--ops-heading)]">{me?.name ?? ""}</p>
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

export default function OpsLayout({ children, openInquiries, pendingSignups }: { children: ReactNode; openInquiries?: number | null; pendingSignups?: number | null }) {
  const badges = useBadges({ openInquiries, pendingSignups });
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--ops-bg)] text-[var(--ops-body)]">
      <OpsSidebar badges={badges} />
      <div className="flex min-w-0 flex-1 flex-col">
        <OpsTopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
