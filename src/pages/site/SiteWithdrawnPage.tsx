import { useEffect, useState } from "react";
import HomeLayout from "../../components/home/HomeLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import { useToast } from "../../shared/ui/Toast";
import { SkeletonTable } from "../../shared/ui/Skeleton";
import { teamMembersApi, ApiError, isDemoFallback, errorMessage, type TeamMember, type RetentionInfo } from "../../api";

const FALLBACK_MEMBERS: TeamMember[] = [
  { id: "u1", name: "김*수", teamId: "t1", teamName: "홍길동 팀", active: false, withdrawnAt: "2026-09-20" },
  { id: "u2", name: "박*민", teamId: "t2", teamName: "김영희 팀", active: false, withdrawnAt: "2026-08-02" },
  { id: "u3", name: "이*준", teamId: "t3", teamName: "이철호 팀", active: false, withdrawnAt: "2023-09-01" },
  { id: "u4", name: "최*영", teamId: "t1", teamName: "홍길동 팀", active: false, withdrawnAt: "2023-05-11" },
];

const RETENTION_DAYS = 365;
const pad = (n: number) => String(n).padStart(2, "0");

function parseDate(value: string) {
  const d = new Date(value);
  // "2026.09.20" 형식도 받는다.
  return Number.isNaN(d.getTime()) ? new Date(value.replaceAll(".", "-")) : d;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const d = parseDate(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** 서버 미연결 시 탈퇴일 + 365일로 보관기한을 계산한다. */
function estimateRetention(member: TeamMember): RetentionInfo {
  const base = parseDate(member.withdrawnAt ?? "");
  if (Number.isNaN(base.getTime())) return { retentionUntil: "-", retentionDays: RETENTION_DAYS, canPurge: false };
  const until = new Date(base);
  until.setDate(until.getDate() + RETENTION_DAYS);
  return { retentionUntil: until.toISOString(), retentionDays: RETENTION_DAYS, canPurge: until.getTime() <= Date.now() };
}

export default function SiteWithdrawnPage() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [retention, setRetention] = useState<Record<string, RetentionInfo>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TeamMember | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<TeamMember | null>(null);
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    let alive = true;
    teamMembersApi
      .listTeamMembers()
      .then((res) => {
        if (alive) setMembers(res.items.filter((m) => !m.active));
      })
      .catch((err) => {
        if (!alive) return;
        if (isDemoFallback(err)) setMembers(FALLBACK_MEMBERS);
        else showToast(errorMessage(err, "탈퇴 회원 목록을 불러오지 못했어요."), "error");
      })
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [showToast]);

  const fetchRetention = async (member: TeamMember): Promise<RetentionInfo | null> => {
    if (retention[member.id]) return retention[member.id];
    setLoadingId(member.id);
    try {
      const info = await teamMembersApi.getRetention(member.id);
      setRetention((prev) => ({ ...prev, [member.id]: info }));
      return info;
    } catch (err) {
      if (isDemoFallback(err)) {
        const info = estimateRetention(member);
        setRetention((prev) => ({ ...prev, [member.id]: info }));
        return info;
      }
      showToast(errorMessage(err, "보관기한을 조회하지 못했어요."), "error");
      return null;
    } finally {
      setLoadingId(null);
    }
  };

  const openDetail = async (member: TeamMember) => {
    if (await fetchRetention(member)) setDetail(member);
  };

  const requestPurge = async (member: TeamMember) => {
    const info = await fetchRetention(member);
    if (!info) return;
    if (!info.canPurge) {
      showToast(`보관기한(${formatDate(info.retentionUntil)})이 지나야 파기할 수 있어요.`, "error");
      return;
    }
    setPurgeTarget(member);
  };

  const confirmPurge = async () => {
    if (!purgeTarget || purging) return;
    setPurging(true);
    try {
      await teamMembersApi.purgePersonalData(purgeTarget.id);
      setMembers((prev) => prev.filter((m) => m.id !== purgeTarget.id));
      showToast(`${purgeTarget.name} 님의 개인정보를 파기했어요.`, "success");
    } catch (err) {
      if (isDemoFallback(err)) {
        setMembers((prev) => prev.filter((m) => m.id !== purgeTarget.id));
        showToast(`${purgeTarget.name} 님의 개인정보를 파기했어요. (데모)`, "success");
      } else if (err instanceof ApiError && err.status === 409) {
        showToast("보관기한(365일)이 지나지 않아 아직 파기할 수 없어요.", "error");
      } else {
        showToast(errorMessage(err, "파기에 실패했어요."), "error");
      }
    } finally {
      setPurging(false);
      setPurgeTarget(null);
    }
  };

  const detailInfo = detail ? retention[detail.id] : undefined;

  return (
    <HomeLayout>
      <SiteManagementHeader active="withdrawn" />

      <div className="w-full pt-8">
        <p className="text-[var(--color-text-body)] text-xs pb-3">
          탈퇴한 팀원의 개인정보는 {RETENTION_DAYS}일간 보관 후 파기할 수 있어요.
        </p>
        {!loaded && <SkeletonTable rows={4} />}
        <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg w-full overflow-hidden ${loaded ? "" : "hidden"}`}>
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
                  <td className="px-4 py-3 text-xs font-['JetBrains_Mono',monospace] text-[var(--color-text-body)]">{formatDate(m.withdrawnAt)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openDetail(m)}
                      disabled={loadingId === m.id}
                      className="text-xs text-[var(--color-text-label)] hover:text-[var(--color-accent)] transition mr-3 disabled:opacity-50"
                    >
                      {loadingId === m.id ? "조회 중..." : "보관기한 조회"}
                    </button>
                    <button
                      type="button"
                      onClick={() => requestPurge(m)}
                      disabled={loadingId === m.id}
                      className="text-xs text-[var(--color-danger-text)] hover:brightness-125 transition disabled:opacity-50"
                    >
                      파기
                    </button>
                  </td>
                </tr>
              ))}
              {loaded && members.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-[var(--color-text-faint)] text-sm py-8">
                    탈퇴한 회원이 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && detailInfo && (
        <ConfirmDialog
          title={`${detail.name} 님의 보관기한`}
          description={`${formatDate(detailInfo.retentionUntil)}까지 보관 (총 ${detailInfo.retentionDays}일)\n${
            detailInfo.canPurge ? "보관기한이 지나 지금 파기할 수 있어요." : "보관기한이 지나면 파기할 수 있어요."
          }`}
          confirmLabel="닫기"
          hideCancel
          onConfirm={() => setDetail(null)}
          onCancel={() => setDetail(null)}
        />
      )}

      {purgeTarget && (
        <ConfirmDialog
          title="정말 파기할까요?"
          description={`${purgeTarget.name} 님의 개인정보를 즉시 파기합니다.\n파기한 정보는 복구할 수 없어요.`}
          confirmLabel={purging ? "파기 중..." : "파기하기"}
          destructive
          busy={purging}
          onConfirm={confirmPurge}
          onCancel={() => setPurgeTarget(null)}
        />
      )}
    </HomeLayout>
  );
}
