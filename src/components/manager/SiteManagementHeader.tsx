import { Link } from "react-router-dom";
import { useSiteMe } from "../../hooks/useSiteMe";

export type SiteTab = "today" | "team" | "checklist" | "schedule" | "withdrawn";

const TABS: { key: SiteTab; label: string; to: string }[] = [
  { key: "today", label: "오늘 현황", to: "/manager/sites" },
  { key: "team", label: "팀 관리", to: "/manager/sites/team" },
  { key: "checklist", label: "체크리스트", to: "/manager/sites/checklist" },
  { key: "schedule", label: "시간 설정", to: "/manager/sites/schedule" },
  { key: "withdrawn", label: "탈퇴 회원", to: "/manager/sites/withdrawn" },
];

export default function SiteManagementHeader({ active, siteName }: { active: SiteTab; siteName?: string }) {
  const me = useSiteMe();

  return (
    <div className="w-full">
      <h1 className="font-semibold text-[var(--color-text-heading)] text-xl">현장 관리</h1>
      <p className="text-[var(--color-text-body)] text-sm pt-0.5">{siteName ?? me.site.name}</p>

      <div className="border-b border-[var(--color-border)] flex items-center w-full mt-6 overflow-x-auto [scrollbar-width:none]">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            to={tab.to}
            aria-current={active === tab.key ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap px-4 sm:px-5 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
              active === tab.key
                ? "border-[var(--color-accent)] text-[var(--color-text-heading)] font-medium"
                : "border-transparent text-[var(--color-text-body)] hover:text-[var(--color-text-label)]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
