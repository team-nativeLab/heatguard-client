import { useEffect, useState } from "react";
import HomeLayout from "../../components/home/HomeLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { teamMembersApi, isNetworkError, ApiError, type TeamMember, type RetentionInfo } from "../../api";

const FALLBACK_MEMBERS: TeamMember[] = [
  { id: "u1", name: "김*수", teamId: "t1", teamName: "홍길동 팀", active: false, withdrawnAt: "2026.09.20" },
  { id: "u2", name: "박*민", teamId: "t2", teamName: "김영희 팀", active: false, withdrawnAt: "2026.08.02" },
  { id: "u3", name: "이*준", teamId: "t3", teamName: "이철호 팀", active: false, withdrawnAt: "2023.09.01" },
  { id: "u4", name: "최*영", teamId: "t1", teamName: "홍길동 팀", active: false, withdrawnAt: "2023.05.11" },
];

export default function Screen23_현장관리_탈퇴회원() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [retention, setRetention] = useState<Record<string, RetentionInfo>>({});
  const [detail, setDetail] = useState<TeamMember | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<TeamMember | null>(null);
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    let alive = true;
    teamMembersApi
      .listTeamMembers()
      .then((res) => {
        if (!alive) return;
        const withdrawn = res.items.filter((m) => !m.active);
        setMembers(withdrawn.length ? withdrawn : FALLBACK_MEMBERS);
      })
      .catch(() => {
        if (alive) setMembers(FALLBACK_MEMBERS);
      });
    return () => {
      alive = false;
    };
  }, []);

  const loadRetention = async (member: TeamMember) => {
    try {
      const info = await teamMembersApi.getRetention(member.id);
      setRetention((prev) => ({ ...prev, [member.id]: info }));
    } catch {
      setRetention((prev) => ({
        ...prev,
        [member.id]: { retentionUntil: "-", retentionDays: 365, canPurge: false },
      }));
    }
    setDetail(member);
  };

  const confirmPurge = async () => {
    if (!purgeTarget || purging) return;
    setPurging(true);
    try {
      await teamMembersApi.purgePersonalData(purgeTarget.id);
      setMembers((prev) => prev.filter((m) => m.id !== purgeTarget.id));
      showToast(`${purgeTarget.name} 님의 개인정보를 파기했어요.`, "success");
    } catch (err) {
      if (isNetworkError(err)) {
        setMembers((prev) => prev.filter((m) => m.id !== purgeTarget.id));
        showToast(`${purgeTarget.name} 님의 개인정보를 파기했어요. (데모)`, "success");
      } else if (err instanceof ApiError && err.status === 409) {
        showToast("보관기한(365일)이 지나지 않아 아직 파기할 수 없어요.", "error");
      } else {
        showToast(err instanceof ApiError ? err.message : "파기에 실패했어요.", "error");
      }
    } finally {
      setPurging(false);
      setPurgeTarget(null);
    }
  };

  return (
    <HomeLayout>
      <SiteManagementHeader active="withdrawn" />

      <div className="w-full pt-8">
        <div className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg w-full overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[11px] text-[var(--color-text-faint)]">
                <th className="px-4 py-2.5 font-medium">이름</th>
                <th className="px-4 py-2.5 font-medium">소속 팀</th>
                <th className="px-4 py-2.5 font-medium">탈퇴일</th>
                <th className="px-4 py-2.5 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-4 py-3 text-sm text-[var(--color-text-value)]">{m.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text-body)]">{m.teamName}</td>
                  <td className="px-4 py-3 text-xs font-['JetBrains_Mono',monospace] text-[var(--color-text-body)]">{m.withdrawnAt ?? "-"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => loadRetention(m)}
                      className="text-xs text-[var(--color-text-label)] hover:text-[var(--color-accent)] transition mr-3"
                    >
                      보관기한 조회
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurgeTarget(m)}
                      className="text-xs text-[var(--color-danger-text)] hover:brightness-125 transition"
                    >
                      파기
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-[var(--color-text-faint)] text-sm py-8">
                    탈퇴한 회원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <ConfirmDialog
          title={`${detail.name} 님의 보관기한`}
          description={
            retention[detail.id]
              ? `${retention[detail.id].retentionUntil}까지 보관 (총 ${retention[detail.id].retentionDays}일)`
              : "조회 중..."
          }
          confirmLabel="닫기"
          onConfirm={() => setDetail(null)}
          onCancel={() => setDetail(null)}
        />
      )}

      {purgeTarget && (
        <ConfirmDialog
          title="정말 파기할까요?"
          description={`${purgeTarget.name} 님의 개인정보를 즉시 파기합니다. 보관기한(365일) 전에는 파기할 수 없어요.`}
          confirmLabel={purging ? "파기 중..." : "파기하기"}
          destructive
          onConfirm={confirmPurge}
          onCancel={() => setPurgeTarget(null)}
        />
      )}
    </HomeLayout>
  );
}
