import { useState } from "react";
import ManagerLayout from "../../components/manager/ManagerLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import RecordsTable, { DEFAULT_RECORDS } from "../../components/manager/RecordsTable";
import PhotoLightbox from "../../components/manager/PhotoLightbox";

const TEAMS = [
  {
    name: "A팀",
    manager: "홍길동 · 3층 외벽",
    heat: "36.2°C",
    heatLabel: "폭염 경보",
    heatBg: "bg-[#f97316]/[0.14]",
    heatText: "text-[#ea580c]",
    logs: [{ time: "07:00", done: true }, { time: "09:00", done: true }, { time: "11:00", done: false }],
    checklist: "체크리스트 4/6",
  },
  {
    name: "B팀",
    manager: "김영희 · 지하 1층 배관",
    heat: "34.5°C",
    heatLabel: "폭염 주의보",
    heatBg: "bg-[#fbbf24]/[0.14]",
    heatText: "text-[#d97706]",
    logs: [{ time: "07:00", done: true }, { time: "09:00", done: true }, { time: "11:00", done: false }],
    checklist: "체크리스트 4/6",
  },
  {
    name: "C팀 (하청)",
    manager: "이철호 · 옥상 방수",
    heat: null,
    heatLabel: "미입력",
    heatBg: "bg-[var(--color-bg-tile)]",
    heatText: "text-[var(--color-text-body)]",
    logs: [{ time: "07:00", done: true }, { time: "09:00", done: true }, { time: "11:00", done: false }],
    checklist: "체크리스트 4/6",
  },
];

export default function Screen11_05_계정설정() {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div className="relative w-full h-full">
      <ManagerLayout>
        <div className="w-full flex flex-col items-start">
          <SiteManagementHeader active="today" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full pt-8">
            {TEAMS.map((team) => (
              <div key={team.name} className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg p-4 flex flex-col">
                <div className="flex items-start justify-between w-full gap-2">
                  <div>
                    <p className="font-medium leading-5 text-sm text-[var(--color-text-heading)]">{team.name}</p>
                    <p className="leading-4 text-[var(--color-text-body)] text-xs pt-0.5">{team.manager}</p>
                  </div>
                  <span className={`${team.heatBg} ${team.heatText} flex gap-1.5 items-center px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono',monospace] font-medium whitespace-nowrap`}>
                    {team.heat ? (
                      <>
                        {team.heat}
                        <span className="opacity-70">·</span>
                        {team.heatLabel}
                      </>
                    ) : (
                      team.heatLabel
                    )}
                  </span>
                </div>

                <div className="flex gap-1.5 pt-3 flex-wrap">
                  {team.logs.map((log) => (
                    <span
                      key={log.time}
                      className={`text-[10px] px-2 py-0.5 rounded font-['JetBrains_Mono',monospace] border ${
                        log.done
                          ? "bg-[var(--color-checktime-done-bg)] border-[var(--color-checktime-done-border)] text-[var(--color-checktime-done-text)]"
                          : "border-[var(--color-border)] text-[var(--color-text-faint)]"
                      }`}
                    >
                      {log.done ? "✓ " : ""}
                      {log.time}
                    </span>
                  ))}
                </div>

                <p className="font-['JetBrains_Mono',monospace] leading-[16.5px] text-[var(--color-text-body)] text-[11px] pt-3">
                  {team.checklist}
                </p>
              </div>
            ))}
          </div>

          <div className="w-full pt-8">
            <h2 className="text-[var(--color-text-label)] text-sm font-medium">오늘 기록 전체</h2>
            <div className="pt-3">
              <RecordsTable rows={DEFAULT_RECORDS} onPhotoClick={() => setLightboxOpen(true)} />
            </div>
          </div>
        </div>
      </ManagerLayout>

      {lightboxOpen && (
        <PhotoLightbox
          takenAt="2026.08.05 09:02"
          siteName="인천 복합물류센터 신축"
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
