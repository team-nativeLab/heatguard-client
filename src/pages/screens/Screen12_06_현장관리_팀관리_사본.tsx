import { useEffect, useState } from "react";
import HomeLayout from "../../components/home/HomeLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import TeamDetailModal, { type TeamDetail } from "../../components/manager/TeamDetailModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { TeamMemberIcon } from "../../components/icons/Icons";
import { teamsApi, isNetworkError, ApiError, type TeamSummary } from "../../api";

const FALLBACK_TEAMS: TeamSummary[] = [
  { id: "t1", qrCodeUrl: "", leaderName: "홍길동", workLocation: "3층 외벽", contact: "010-1234-5678", memberCount: 8, accessUrl: "https://heatguard.app/t/abc123", active: true },
  { id: "t2", qrCodeUrl: "", leaderName: "김영희", workLocation: "지하 1층 배관", contact: "010-9876-5432", memberCount: 6, accessUrl: "https://heatguard.app/t/def456", active: true },
  { id: "t3", qrCodeUrl: "", leaderName: "이철호", workLocation: "옥상 방수", contact: "010-5555-7777", memberCount: 4, accessUrl: "https://heatguard.app/t/ghi789", active: true },
];

function toTeamDetail(team: TeamSummary): TeamDetail {
  return {
    name: team.leaderName,
    place: team.workLocation || "미지정",
    phone: team.contact || "-",
    count: team.memberCount ? `${team.memberCount}명` : "-",
    token: team.accessUrl,
  };
}

export default function Screen12_06_현장관리_팀관리_사본() {
  const { showToast } = useToast();
  const [teams, setTeams] = useState<TeamSummary[]>(FALLBACK_TEAMS);
  const [loaded, setLoaded] = useState(false);
  const [openTeam, setOpenTeam] = useState<TeamSummary | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TeamSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [leaderName, setLeaderName] = useState("");
  const [place, setPlace] = useState("");
  const [phone, setPhone] = useState("");
  const [count, setCount] = useState("");

  useEffect(() => {
    let alive = true;
    teamsApi
      .listTeams()
      .then((res) => {
        if (alive) {
          setTeams(res.items);
          setLoaded(true);
        }
      })
      .catch((err) => {
        console.warn("팀 목록 조회 실패 — 데모 데이터로 표시합니다.", err);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleShare = async (team: TeamSummary) => {
    await navigator.clipboard?.writeText(team.accessUrl).catch(() => {});
    window.open(team.accessUrl, "_blank", "noopener,noreferrer");
    showToast(`${team.leaderName} 팀 접속 URL을 복사했어요.`, "success");
  };

  const handleAddTeam = async () => {
    if (!leaderName.trim()) {
      showToast("팀장 이름은 필수예요.", "error");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    const payload = {
      leaderName: leaderName.trim(),
      workLocation: place.trim() || undefined,
      contact: phone.trim() || undefined,
      memberCount: count.trim() ? Number(count.trim()) : undefined,
    };
    try {
      const created = await teamsApi.createTeam(payload);
      setTeams((prev) => [...prev, created]);
      showToast("팀이 추가됐어요.", "success");
      setLeaderName("");
      setPlace("");
      setPhone("");
      setCount("");
    } catch (err) {
      if (isNetworkError(err)) {
        setTeams((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            qrCodeUrl: "",
            leaderName: payload.leaderName,
            workLocation: payload.workLocation || "미지정",
            contact: payload.contact || "-",
            memberCount: payload.memberCount || 0,
            accessUrl: `https://heatguard.app/t/${Math.random().toString(36).slice(2, 8)}`,
            active: true,
          },
        ]);
        showToast("팀이 추가됐어요. (데모)", "success");
        setLeaderName("");
        setPlace("");
        setPhone("");
        setCount("");
        return;
      }
      showToast(err instanceof ApiError ? err.message : "팀 추가에 실패했어요.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    try {
      await teamsApi.deactivateTeam(target.id);
      setTeams((prev) => prev.filter((t) => t.id !== target.id));
      showToast(`${target.leaderName} 팀을 삭제했어요.`);
    } catch (err) {
      if (isNetworkError(err)) {
        setTeams((prev) => prev.filter((t) => t.id !== target.id));
        showToast(`${target.leaderName} 팀을 삭제했어요. (데모)`);
      } else {
        showToast(err instanceof ApiError ? err.message : "팀 삭제에 실패했어요.", "error");
      }
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <HomeLayout>
      <div className="w-full flex flex-col items-start">
        <SiteManagementHeader active="team" />

        <div className="flex flex-col gap-2 w-full pt-8">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center px-5 py-4 w-full"
            >
              <div className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded flex items-center justify-center size-8 shrink-0 text-[var(--color-text-faint)] overflow-hidden">
                {team.qrCodeUrl ? (
                  <img src={team.qrCodeUrl} alt="접속 QR 코드" className="size-full object-cover" />
                ) : (
                  <TeamMemberIcon className="size-4" />
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 flex-1 min-w-0 w-full">
                <div>
                  <p className="font-medium leading-5 text-sm text-[var(--color-text-heading)]">{team.leaderName}</p>
                  <p className="leading-4 text-[var(--color-text-body)] text-xs">{team.workLocation || "미지정"}</p>
                </div>
                <p className="font-['JetBrains_Mono',monospace] leading-4 text-[var(--color-text-label)] text-xs self-center">
                  {team.contact || "-"}
                </p>
                <p className="leading-4 text-[var(--color-text-label)] text-xs self-center">
                  {team.memberCount ? `${team.memberCount}명` : "-"}
                </p>
                <p className="font-['JetBrains_Mono',monospace] leading-4 text-[var(--color-text-body)] text-[11px] self-center truncate">
                  {team.accessUrl}
                </p>
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
          {loaded && teams.length === 0 && (
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
                inputMode="numeric"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded h-[38px] px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleAddTeam}
            disabled={submitting}
            className="bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-1.5 rounded hover:brightness-110 transition disabled:opacity-60"
          >
            {submitting ? "추가 중..." : "팀 추가"}
          </button>
        </div>
      </div>

      {openTeam && <TeamDetailModal team={toTeamDetail(openTeam)} onClose={() => setOpenTeam(null)} />}

      {pendingDelete && (
        <ConfirmDialog
          title={`${pendingDelete.leaderName} 팀을 삭제할까요?`}
          description="삭제하면 되돌릴 수 없어요."
          confirmLabel="삭제"
          destructive
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </HomeLayout>
  );
}
