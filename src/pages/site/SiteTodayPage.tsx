import { useEffect, useState } from "react";
import HomeLayout from "../../components/home/HomeLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import RecordsTable, { DEFAULT_RECORDS, type RecordRow } from "../../components/manager/RecordsTable";
import PhotoLightbox from "../../shared/ui/PhotoLightbox";
import { useSiteMe } from "../../hooks/useSiteMe";
import { teamsApi, recordsApi, settingsApi, checklistsApi, isDemoFallback, type RecordItem, type TeamSummary } from "../../api";
import { toRecordRow } from "../../lib/records";
import { LoadError, Skeleton, SkeletonTable } from "../../shared/ui/Skeleton";

interface TeamStatusToday {
  teamId: string;
  teamName: string;
  leaderName: string;
  workLocation: string;
  feelsLike: number | null;
  heatLevel: string | null;
  checkTimes: { time: string; done: boolean }[];
  checklistDone: number | null;
  checklistTotal: number | null;
}

const FALLBACK_TEAMS: TeamStatusToday[] = [
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
];

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** 체감온도 기준 폭염 단계 (31/33/35/38°C, API HeatLevel 단계와 동일한 구간) */
function heatLevelOf(feelsLike: number | null): string | null {
  if (feelsLike == null) return null;
  if (feelsLike >= 38) return "폭염 중대경보";
  if (feelsLike >= 35) return "폭염 경보";
  if (feelsLike >= 33) return "폭염 주의보";
  if (feelsLike >= 31) return "관심";
  return "정상";
}

function heatBadgeClass(level: string | null) {
  if (level === "폭염 중대경보") return { bg: "bg-[#ef4444]/[0.14]", text: "text-[#dc2626]" };
  if (level === "폭염 경보") return { bg: "bg-[#f97316]/[0.14]", text: "text-[#ea580c]" };
  if (level === "폭염 주의보") return { bg: "bg-[#fbbf24]/[0.16]", text: "text-[#d97706]" };
  return { bg: "bg-[var(--color-bg-tile)]", text: "text-[var(--color-text-body)]" };
}

function buildTeamStatus(team: TeamSummary, records: RecordItem[], checkTimes: string[], checklistTotal: number | null): TeamStatusToday {
  const mine = records.filter((r) => r.teamId === team.id);
  const latest = [...mine].sort((a, b) => b.time.localeCompare(a.time)).find((r) => r.apparentTemperature != null);
  const feelsLike = latest?.apparentTemperature ?? null;
  const thermoTimes = mine.filter((r) => r.type === "온도계").map((r) => toMinutes(r.time));
  return {
    teamId: team.id,
    teamName: `${team.leaderName} 팀`,
    leaderName: team.leaderName,
    workLocation: team.workLocation || "미지정",
    feelsLike,
    heatLevel: heatLevelOf(feelsLike),
    // 설정된 체크 시간 전후 1시간 안에 온도 기록이 있으면 완료로 본다.
    checkTimes: checkTimes.map((time) => ({
      time,
      done: thermoTimes.some((m) => Math.abs(m - toMinutes(time)) <= 60),
    })),
    checklistDone: null,
    checklistTotal,
  };
}

export default function SiteTodayPage() {
  const me = useSiteMe();
  const [lightbox, setLightbox] = useState<RecordRow | null>(null);
  const [teams, setTeams] = useState<TeamStatusToday[] | null>(null);
  const [rows, setRows] = useState<RecordRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    const date = todayStr();
    Promise.all([
      teamsApi.listTeams(),
      recordsApi.listAllRecords({ date }),
      settingsApi.getCheckTimes().catch(() => null),
      checklistsApi.listChecklistItems().catch(() => null),
    ])
      .then(([teamsRes, recordsRes, checkTimesRes, checklistRes]) => {
        if (!alive) return;
        const checkTimes = checkTimesRes?.times ?? [];
        const checklistTotal = checklistRes ? checklistRes.items.filter((i) => i.active).length : null;
        setTeams(
          teamsRes.items
            .filter((t) => t.active)
            .map((t) => buildTeamStatus(t, recordsRes.items, checkTimes, checklistTotal)),
        );
        setRows(recordsRes.items.map(toRecordRow));
      })
      .catch((err) => {
        if (!alive) return;
        if (isDemoFallback(err)) {
          setTeams(FALLBACK_TEAMS);
          setRows(DEFAULT_RECORDS);
        } else {
          setFailed(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  if (failed || !teams || !rows) {
    return (
      <HomeLayout>
        <div className="w-full flex flex-col items-start">
          <SiteManagementHeader active="today" />
          <div className="w-full pt-8">
            {failed ? (
              <LoadError message="오늘 현황을 불러오지 못했어요." onRetry={() => setAttempt((n) => n + 1)} />
            ) : (
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-[132px] rounded-lg" />
                  ))}
                </div>
                <SkeletonTable rows={4} />
              </div>
            )}
          </div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="w-full flex flex-col items-start">
        <SiteManagementHeader active="today" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full pt-8">
          {teams.map((team) => {
            const badge = heatBadgeClass(team.heatLevel);
            return (
              <div
                key={team.teamId}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4 flex flex-col"
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

                <div className="flex gap-1.5 pt-3 flex-wrap min-h-[26px]">
                  {team.checkTimes.length === 0 && (
                    <span className="text-[10px] text-[var(--color-text-faint)]">설정된 체크 시간이 없어요</span>
                  )}
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
                  체크리스트 {team.checklistDone ?? "-"}/{team.checklistTotal ?? "-"}
                </p>
              </div>
            );
          })}
          {teams.length === 0 && (
            <p className="md:col-span-3 text-[var(--color-text-faint)] text-sm py-6">
              등록된 팀이 없어요. ‘팀 관리’ 탭에서 팀을 추가해주세요.
            </p>
          )}
        </div>

        <div className="w-full pt-8">
          <h2 className="text-[var(--color-text-label)] text-sm font-medium">
            오늘 기록 전체 <span className="ml-1 text-xs text-[var(--color-text-faint)]">{rows.length}건</span>
          </h2>
          <div className="pt-3">
            <RecordsTable rows={rows} onPhotoClick={setLightbox} emptyText="오늘 등록된 기록이 없어요." />
          </div>
        </div>
      </div>

      {lightbox && (
        <PhotoLightbox
          photoUrl={lightbox.photoUrl}
          takenAt={`${todayStr().replaceAll("-", ".")} ${lightbox.time}`}
          siteName={`${me.site.name} · ${lightbox.place}`}
          onClose={() => setLightbox(null)}
        />
      )}
    </HomeLayout>
  );
}
