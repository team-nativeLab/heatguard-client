export interface TeamStatus {
  name: string;
  member: string;
  location: string;
  temp?: string;
  level?: string;
  levelColor?: string;
  levelBg?: string;
  unrecorded?: boolean;
  checkTimes: { time: string; done: boolean }[];
  checklistProgress: string;
}

export default function TeamStatusCard({ team }: { team: TeamStatus }) {
  return (
    <div className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg p-4 flex flex-col">
      <div className="flex items-start justify-between w-full gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm text-[var(--color-text-heading)] truncate">{team.name}</p>
          <p className="text-[var(--color-text-body)] text-xs pt-0.5 truncate">
            {team.member} · {team.location}
          </p>
        </div>
        {team.unrecorded ? (
          <span className="bg-[var(--color-bg-tile)] text-[var(--color-text-body)] text-[10px] px-2 py-0.5 rounded shrink-0 whitespace-nowrap">
            미입력
          </span>
        ) : (
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded shrink-0 whitespace-nowrap"
            style={{ backgroundColor: team.levelBg, color: team.levelColor }}
          >
            {team.temp} · {team.level}
          </span>
        )}
      </div>

      <div className="flex gap-1.5 pt-3 flex-wrap">
        {team.checkTimes.map((t) => (
          <span
            key={t.time}
            className={`text-[10px] px-2 py-0.5 rounded border font-['JetBrains_Mono',monospace] ${
              t.done
                ? "bg-[var(--color-checktime-done-bg)] border-[var(--color-checktime-done-border)] text-[var(--color-checktime-done-text)]"
                : "border-[var(--color-border)] text-[var(--color-text-faint)]"
            }`}
          >
            {t.done ? `✓ ${t.time}` : t.time}
          </span>
        ))}
      </div>

      <p className="font-['JetBrains_Mono',monospace] text-[var(--color-text-body)] text-[11px] pt-3">
        체크리스트 {team.checklistProgress}
      </p>
    </div>
  );
}
