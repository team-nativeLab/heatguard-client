import { useEffect, useState } from "react";
import HomeLayout from "../../components/home/HomeLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import RecordsTable, { DEFAULT_RECORDS, type RecordRow } from "../../components/manager/RecordsTable";
import PhotoLightbox from "../../components/manager/PhotoLightbox";
import { teamsApi, recordsApi, type RecordItem } from "../../api";
import { toRecordRow } from "../../lib/records";

interface TeamStatusToday {
  teamId: string;
  teamName: string;
  leaderName: string;
  workLocation: string;
  feelsLike: number | null;
  heatLevel: string | null;
  checkTimes: { time: string; done: boolean }[];
  checklistDone: number;
  checklistTotal: number;
}

interface StatusTodayResponse {
  teams: TeamStatusToday[];
  records: RecordItem[];
}

const FALLBACK: StatusTodayResponse = {
  teams: [
    {
      teamId: "t1",
      teamName: "A팀",
      leaderName: "홍길동",
      workLocation: "3층 외벽",
      feelsLike: 36.2,
      heatLevel: "폭염 경보",
      checkTimes: [
        { time: "07:00", done: true },
        { time: "09:00", done: true },
        { time: "11:00", done: false },
      ],
      checklistDone: 4,
      checklistTotal: 6,
    },
    {
      teamId: "t2",
      teamName: "B팀",
      leaderName: "김영희",
      workLocation: "지하 1층 배관",
      feelsLike: 34.5,
      heatLevel: "폭염 주의보",
      checkTimes: [
        { time: "07:00", done: true },
        { time: "09:00", done: true },
        { time: "11:00", done: false },
      ],
      checklistDone: 4,
      checklistTotal: 6,
    },
    {
      teamId: "t3",
      teamName: "C팀 (하청)",
      leaderName: "이철호",
      workLocation: "옥상 방수",
      feelsLike: null,
      heatLevel: null,
      checkTimes: [
        { time: "07:00", done: true },
        { time: "09:00", done: true },
        { time: "11:00", done: false },
      ],
      checklistDone: 4,
      checklistTotal: 6,
    },
  ],
  records: [],
};

function heatBadgeClass(level: string | null) {
  if (level === "폭염 경보") return { bg: "bg-[#f97316]/[0.14]", text: "text-[#ea580c]" };
  if (level === "폭염 주의보") return { bg: "bg-[#fbbf24]/[0.14]", text: "text-[#d97706]" };
  return { bg: "bg-[var(--color-bg-tile)]", text: "text-[var(--color-text-body)]" };
}

export default function Screen11_05_계정설정() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [status, setStatus] = useState<StatusTodayResponse>(FALLBACK);

  useEffect(() => {
    let alive = true;
    Promise.all([teamsApi.listTeams(), recordsApi.listRecords()])
      .then(([teamsRes, recordsRes]) => {
        if (!alive) return;

        const teams: TeamStatusToday[] = teamsRes.items.map((team, i) => ({
          teamId: team.id,
          teamName: team.leaderName ? `${team.leaderName} 팀` : `팀 ${i + 1}`,
          leaderName: team.leaderName,
          workLocation: team.workLocation,
          feelsLike: FALLBACK.teams[i % FALLBACK.teams.length].feelsLike,
          heatLevel: FALLBACK.teams[i % FALLBACK.teams.length].heatLevel,
          checkTimes: FALLBACK.teams[i % FALLBACK.teams.length].checkTimes,
          checklistDone: FALLBACK.teams[i % FALLBACK.teams.length].checklistDone,
          checklistTotal: FALLBACK.teams[i % FALLBACK.teams.length].checklistTotal,
        }));
        setStatus({ teams: teams.length ? teams : FALLBACK.teams, records: recordsRes.items });
      })
      .catch((err) => {
        console.warn("오늘 현황 조회 실패 — 데모 데이터로 표시합니다.", err);
      });
    return () => {
      alive = false;
    };
  }, []);

  const rows: RecordRow[] = status.records.length ? status.records.map(toRecordRow) : DEFAULT_RECORDS;

  return (
    <div className="relative w-full h-full">
      <HomeLayout>
        <div className="w-full flex flex-col items-start">
          <SiteManagementHeader active="today" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full pt-8">
            {status.teams.map((team) => {
              const badge = heatBadgeClass(team.heatLevel);
              return (
                <div
                  key={team.teamId}
                  className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg p-4 flex flex-col"
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div>
                      <p className="font-medium leading-5 text-sm text-[var(--color-text-heading)]">{team.teamName}</p>
                      <p className="leading-4 text-[var(--color-text-body)] text-xs pt-0.5">
                        {team.leaderName} · {team.workLocation}
                      </p>
                    </div>
                    <span
                      className={`${badge.bg} ${badge.text} flex gap-1.5 items-center px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono',monospace] font-medium whitespace-nowrap`}
                    >
                      {team.feelsLike != null ? (
                        <>
                          {team.feelsLike.toFixed(1)}°C
                          <span className="opacity-70">·</span>
                          {team.heatLevel}
                        </>
                      ) : (
                        "미입력"
                      )}
                    </span>
                  </div>

                  <div className="flex gap-1.5 pt-3 flex-wrap">
                    {team.checkTimes.map((log) => (
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
                    체크리스트 {team.checklistDone}/{team.checklistTotal}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="w-full pt-8">
            <h2 className="text-[var(--color-text-label)] text-sm font-medium">오늘 기록 전체</h2>
            <div className="pt-3">
              <RecordsTable rows={rows} onPhotoClick={() => setLightboxOpen(true)} />
            </div>
          </div>
        </div>
      </HomeLayout>

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
