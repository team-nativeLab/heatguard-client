export interface TeamDetail {
  name: string;
  place: string;
  phone: string;
  count: string;
  token: string;
}

export default function TeamDetailModal({
  team,
  onClose,
}: {
  team: TeamDetail;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 backdrop-blur-sm bg-black/80 flex items-center justify-center z-[90] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden">
        <div className="border-[var(--color-border)] border-b flex items-center justify-between px-5 py-4">
          <h3 className="font-semibold text-[var(--color-text-heading)] text-base">{team.name} 팀</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] text-lg leading-none transition"
          >
            ×
          </button>
        </div>
        <div className="flex flex-col p-5 gap-3">
          {[
            { label: "작업 장소", value: team.place },
            { label: "연락처", value: team.phone },
            { label: "작업 인원", value: team.count },
            { label: "초대 토큰", value: team.token },
          ].map((row) => (
            <div key={row.label} className="flex gap-3">
              <span className="w-20 shrink-0 text-[var(--color-text-body)] text-xs pt-0.5">{row.label}</span>
              <span className="font-['JetBrains_Mono',monospace] text-[var(--color-text-heading)] text-sm">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="border-[var(--color-border)] border-t flex justify-end px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--color-bg-tile)] text-[var(--color-text-label)] text-sm px-4 py-2 rounded hover:brightness-125 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
