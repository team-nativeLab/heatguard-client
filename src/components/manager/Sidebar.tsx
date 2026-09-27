import logo from "../../assets/images/logo.png";
import { DashboardIcon, SiteManageIcon, AccountIcon, ContactIcon } from "../icons/Icons";
import { Link, useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { label: "대시보드", Icon: DashboardIcon, to: "/manager" },
  { label: "현장 관리", Icon: SiteManageIcon, to: "/manager/sites" },
  { label: "계정 설정", Icon: AccountIcon, to: "/manager/account" },
  { label: "문의하기", Icon: ContactIcon, to: "/manager/contact" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div
      className="bg-[var(--color-bg-surface)] border-[var(--color-border)] border-r border-solid flex flex-col h-full items-start shrink-0 w-[208px]"
      data-name="Sidebar"
    >
      <div className="border-[var(--color-border)] border-b border-solid flex flex-col items-start p-5 w-full">
        <div className="flex gap-2.5 items-center w-full">
          <div className="bg-[#0f172a] flex items-center justify-center rounded shrink-0 size-6 overflow-hidden">
            <img alt="폭염가드 로고" className="size-[25px] object-cover" src={logo} />
          </div>
          <p className="font-semibold leading-5 text-sm text-[var(--color-text-heading)] whitespace-nowrap">폭염가드</p>
        </div>
        <div className="flex flex-col pl-8 pt-0.5 w-full">
          <p className="font-['JetBrains_Mono',monospace] leading-[15px] text-[var(--color-text-body)] text-[10px] tracking-[0.5px] whitespace-nowrap">
            현장
          </p>
        </div>
      </div>

      <div className="border-[var(--color-border)] border-b border-solid flex flex-col items-start px-5 py-4 w-full">
        <p className="leading-[15px] text-[var(--color-text-body)] text-[10px]">지금 체감온도</p>
        <div className="flex items-baseline pt-1.5 text-[#fbbf24] whitespace-nowrap">
          <span className="font-medium leading-8 text-2xl">36.2</span>
          <span className="leading-4 text-xs">°C</span>
        </div>
        <p className="leading-[16.5px] text-[#fbbf24] text-[11px] pt-0.5">폭염 주의보</p>
      </div>

      <nav className="flex flex-1 flex-col items-start px-3 py-4 w-full gap-0.5">
        {NAV_ITEMS.map(({ label, Icon, to }) => {
          const active = to === "/manager" ? location.pathname === "/manager" : location.pathname.startsWith(to);
          return (
            <Link
              key={label}
              to={to}
              className={`flex gap-2.5 items-center px-3 py-2 rounded w-[183px] transition-colors ${
                active ? "bg-[var(--color-bg-tile)]" : "hover:bg-[var(--color-bg-tile)]/60"
              }`}
            >
              <Icon
                className={`size-4 ${active ? "text-[var(--color-text-heading)]" : "text-[var(--color-text-body)]"}`}
              />
              <span
                className={`leading-5 text-sm whitespace-nowrap ${
                  active ? "text-[var(--color-text-heading)]" : "text-[var(--color-text-body)]"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-[var(--color-border)] border-solid border-t flex flex-col items-start p-4 w-full">
        <p className="leading-4 text-[var(--color-text-body)] text-xs">김철수 님</p>
        <p className="leading-[16.5px] text-[var(--color-text-faint)] text-[11px] pt-0.5">인천 복합물류센터</p>
        <button
          type="button"
          onClick={() => navigate("/auth/login")}
          className="leading-[16.5px] text-[var(--color-text-faint)] text-[11px] pt-2 text-center hover:text-[var(--color-text-body)] transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
