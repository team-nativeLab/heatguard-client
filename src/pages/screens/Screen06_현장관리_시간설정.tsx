import { useState } from "react";
import ManagerLayout from "../../components/manager/ManagerLayout";
import SiteTabs, { type SiteTabKey } from "../../components/manager/SiteTabs";
import TeamStatusCard, { type TeamStatus } from "../../components/manager/TeamStatusCard";
import RecordsTable, { DEFAULT_RECORDS } from "../../components/manager/RecordsTable";

const TEAMS: TeamStatus[] = [
  {
    name: "A팀",
    member: "홍길동",
    location: "3층 외벽",
    temp: "36.2°C",
    level: "폭염 경보",
    levelColor: "#ea580c",
    levelBg: "rgba(249,115,22,0.14)",
    checkTimes: [
      { time: "07:00", done: true },
      { time: "09:00", done: true },
      { time: "11:00", done: false },
    ],
    checklistProgress: "4/6",
  },
  {
    name: "B팀",
    member: "김영희",
    location: "지하 1층 배관",
    temp: "34.5°C",
    level: "폭염 주의보",
    levelColor: "#d97706",
    levelBg: "rgba(251,191,36,0.14)",
    checkTimes: [
      { time: "07:00", done: true },
      { time: "09:00", done: true },
      { time: "11:00", done: false },
    ],
    checklistProgress: "4/6",
  },
  {
    name: "C팀 (하청)",
    member: "이철호",
    location: "옥상 방수",
    unrecorded: true,
    checkTimes: [
      { time: "07:00", done: true },
      { time: "09:00", done: true },
      { time: "11:00", done: false },
    ],
    checklistProgress: "4/6",
  },
];

export default function Screen06_현장관리_시간설정() {
  const [tab, setTab] = useState<SiteTabKey>("today");

  return (
    <ManagerLayout>
      <div className="w-full">
        <h1 className="font-semibold text-xl text-[var(--color-text-heading)]">현장 관리</h1>
        <p className="text-[var(--color-text-body)] text-sm pt-0.5">인천 복합물류센터 신축</p>

        <div className="pt-6">
          <SiteTabs active={tab} onChange={setTab} />
        </div>

        <div className="pt-8 flex flex-col gap-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
            {TEAMS.map((team) => (
              <TeamStatusCard key={team.name} team={team} />
            ))}
          </div>

          <div>
            <h2 className="text-[var(--color-text-label)] text-sm font-medium">오늘 기록 전체</h2>
            <div className="pt-3">
              <RecordsTable rows={DEFAULT_RECORDS} />
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
