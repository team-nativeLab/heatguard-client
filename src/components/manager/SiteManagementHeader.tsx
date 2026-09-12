import { Link } from "react-router-dom";

export type SiteTab = "today" | "team" | "checklist" | "schedule";

const TABS: { key: SiteTab; label: string; to: string }[] = [
  { key: "today", label: "오늘 현황", to: "/manager/sites" },
  { key: "team", label: "팀 관리", to: "/manager/sites/team" },
  { key: "checklist", label: "체크리스트", to: "/manager/sites/checklist" },
  { key: "schedule", label: "시간 설정", to: "/manager/sites/schedule" },
];

export default function SiteManagementHeader({
  active,
  siteName = "인천 복합물류센터 신축",
}: {
  active: SiteTab;
  siteName?: string;
}) {
  return (
    <div className="w-full">
      <h1 className="font-semibold text-[var(--color-text-heading)] text-xl">현장 관리</h1>
      <p className="text-[var(--color-text-body)] text-sm pt-0.5">{siteName}</p>

      <div className="border-b border-[var(--color-border)] flex items-center w-full mt-6">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            to={tab.to}
            className={`px-5 py-2.5 text-sm border-b-2 transition-colors ${
              active === tab.key
                ? "border-[var(--color-accent)] text-[var(--color-text-heading)]"
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
