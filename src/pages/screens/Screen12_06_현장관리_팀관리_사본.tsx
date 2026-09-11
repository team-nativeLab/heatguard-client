import { useState } from "react";
import ManagerLayout from "../../components/manager/ManagerLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import TeamDetailModal, { type TeamDetail } from "../../components/manager/TeamDetailModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { TeamMemberIcon } from "../../components/icons/Icons";

const INITIAL_TEAMS: TeamDetail[] = [
  { name: "홍길동", place: "3층 외벽", phone: "010-1234-5678", count: "8명", token: "tok-abc123" },
  { name: "김영희", place: "지하 1층 배관", phone: "010-9876-5432", count: "6명", token: "tok-def456" },
  { name: "이철호", place: "옥상 방수", phone: "010-5555-7777", count: "4명", token: "tok-ghi789" },
];

const genToken = () => `tok-${Math.random().toString(36).slice(2, 8)}`;

export default function Screen12_06_현장관리_팀관리_사본() {
  const { showToast } = useToast();
  const [teams, setTeams] = useState<TeamDetail[]>(INITIAL_TEAMS);
  const [openTeam, setOpenTeam] = useState<TeamDetail | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TeamDetail | null>(null);

  const [leaderName, setLeaderName] = useState("");
  const [place, setPlace] = useState("");
  const [phone, setPhone] = useState("");
  const [count, setCount] = useState("");

  const handleShare = (team: TeamDetail) => {
    navigator.clipboard?.writeText(team.token).catch(() => {});
    showToast(`${team.name} 팀 초대 코드(${team.token})를 복사했어요.`, "success");
  };

  const handleAddTeam = () => {
    if (!leaderName.trim()) {
      showToast("팀장 이름은 필수예요.", "error");
      return;
    }
    setTeams((prev) => [
      ...prev,
      {
        name: leaderName.trim(),
        place: place.trim() || "미지정",
        phone: phone.trim() || "-",
        count: count.trim() ? `${count.trim()}명` : "-",
        token: genToken(),
      },
    ]);
    setLeaderName("");
    setPlace("");
    setPhone("");
    setCount("");
    showToast("팀이 추가됐어요.", "success");
  };

  return (
    <ManagerLayout>
      <div className="w-full flex flex-col items-start">
        <SiteManagementHeader active="team" />

        <div className="flex flex-col gap-2 w-full pt-8">
          {teams.map((team) => (
            <div
              key={team.token}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center px-5 py-4 w-full"
            >
              <div className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded flex items-center justify-center size-8 shrink-0 text-[var(--color-text-faint)]">
                <TeamMemberIcon className="size-4" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 flex-1 min-w-0 w-full">
                <div>
                  <p className="font-medium leading-5 text-sm text-[var(--color-text-heading)]">{team.name}</p>
                  <p className="leading-4 text-[var(--color-text-body)] text-xs">{team.place}</p>
                </div>
                <p className="font-['JetBrains_Mono',monospace] leading-4 text-[var(--color-text-label)] text-xs self-center">{team.phone}</p>
                <p className="leading-4 text-[var(--color-text-label)] text-xs self-center">{team.count}</p>
                <p className="font-['JetBrains_Mono',monospace] leading-4 text-[var(--color-text-body)] text-[11px] self-center truncate">{team.token}</p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleShare(team)}
                  className="border border-[var(--color-border)] text-[var(--color-text-label)] text-xs px-3 py-1.5 rounded hover:brightness-125 transition"
                >
                  공유
                </button>
                <button
                  type="button"
                  onClick={() => setOpenTeam(team)}
                  className="border border-[var(--color-border)] text-[var(--color-text-label)] text-xs px-3 py-1.5 rounded hover:brightness-125 transition"
                >
                  열기
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(team)}
                  className="border border-[var(--color-border)] text-[var(--color-text-body)] text-xs px-3 py-1.5 rounded hover:brightness-125 transition"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
          {teams.length === 0 && (
            <p className="text-[var(--color-text-faint)] text-sm py-6">등록된 팀이 없습니다.</p>
          )}
        </div>

        <div className="border-[var(--color-border)] border-t flex flex-col items-start pt-8 mt-8 w-full">
          <h3 className="font-medium leading-5 text-sm text-[var(--color-text-heading)]">팀 추가</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 max-w-md w-full">
            <label className="flex flex-col gap-1.5">
              <span className="leading-4 text-[var(--color-text-body)] text-xs">팀장 이름 *</span>
              <input
                type="text"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded h-[38px] px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="leading-4 text-[var(--color-text-body)] text-xs">작업 장소</span>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded h-[38px] px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="leading-4 text-[var(--color-text-body)] text-xs">연락처</span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded h-[38px] px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="leading-4 text-[var(--color-text-body)] text-xs">작업 인원</span>
              <input
                type="text"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded h-[38px] px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleAddTeam}
            className="bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-1.5 rounded hover:brightness-110 transition"
          >
            팀 추가
          </button>
        </div>
      </div>

      {openTeam && <TeamDetailModal team={openTeam} onClose={() => setOpenTeam(null)} />}

      {pendingDelete && (
        <ConfirmDialog
          title={`${pendingDelete.name} 팀을 삭제할까요?`}
          description="삭제하면 되돌릴 수 없어요."
          confirmLabel="삭제"
          destructive
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            setTeams((prev) => prev.filter((t) => t.token !== pendingDelete.token));
            showToast(`${pendingDelete.name} 팀을 삭제했어요.`);
            setPendingDelete(null);
          }}
        />
      )}
    </ManagerLayout>
  );
}
