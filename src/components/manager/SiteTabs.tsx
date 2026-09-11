const TABS = [
  { key: "today", label: "오늘 현황" },
  { key: "team", label: "팀 관리" },
  { key: "checklist", label: "체크리스트" },
  { key: "schedule", label: "시간 설정" },
] as const;

export type SiteTabKey = (typeof TABS)[number]["key"];

export default function SiteTabs({
  active,
  onChange,
}: {
  active: SiteTabKey;
  onChange?: (key: SiteTabKey) => void;
}) {
  return (
    <div className="border-[var(--color-border)] border-b border-solid flex items-start w-full">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange?.(tab.key)}
            className={`px-5 py-2.5 text-sm border-b-2 transition-colors ${
              isActive
                ? "border-[var(--color-accent)] text-[var(--color-text-heading)]"
                : "border-transparent text-[var(--color-text-body)] hover:text-[var(--color-text-label)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
