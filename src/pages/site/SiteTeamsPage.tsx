import { useEffect, useState, type FormEvent } from "react";
import HomeLayout from "../../components/home/HomeLayout";
import ModalShell, { btnPrimary, btnSecondary } from "../../components/home/ModalShell";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import TeamDetailModal from "../../components/manager/TeamDetailModal";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import { useToast } from "../../shared/ui/Toast";
import { TeamMemberIcon } from "../../components/icons/Icons";
import { teamsApi, isDemoFallback, errorMessage, type TeamSummary } from "../../api";
import { validateTeamForm, type TeamFormValues } from "../../lib/teamForm";
import { LoadError, SkeletonList } from "../../shared/ui/Skeleton";

const FALLBACK_TEAMS: TeamSummary[] = [
  { id: "t1", name: "A팀", leaderName: "홍길동", workLocation: "3층 외벽", contact: "010-1234-5678", memberCount: 8, active: true, version: 1, loginEmail: "team-a@example.com" },
  { id: "t2", name: "B팀", leaderName: "김영희", workLocation: "지하 1층 배관", contact: "010-9876-5432", memberCount: 6, active: true, version: 1, loginEmail: "team-b@example.com" },
  { id: "t3", name: "C팀", leaderName: "이철호", workLocation: "옥상 방수", contact: "010-5555-7777", memberCount: 4, active: true, version: 1, loginEmail: "team-c@example.com" },
];

const EMPTY_FORM: TeamFormValues = {
  leaderName: "",
  workLocation: "",
  contact: "",
  memberCount: "",
  leaderEmail: "",
  initialPassword: "",
};

const inputCls =
  "bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[38px] px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors";
const ghostBtn =
  "border border-[var(--color-border)] text-[var(--color-text-label)] text-xs px-3 py-1.5 rounded-md hover:bg-[var(--color-bg-tile)] transition";

export default function SiteTeamsPage() {
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TeamSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<TeamFormValues>(EMPTY_FORM);

  const closeAdd = () => {
    if (submitting) return;
    setAdding(false);
    setForm(EMPTY_FORM);
  };

  useEffect(() => {
    let alive = true;
    setFailed(false);
    (async () => {
      try {
        const all: TeamSummary[] = [];
        let cursor: string | undefined;
        do {
          const res = await teamsApi.listTeams({ cursor });
          all.push(...res.items);
          cursor = res.page.nextCursor ?? undefined;
        } while (cursor);
        if (alive) {
          setTeams(all.filter((t) => t.active));
          setLoaded(true);
        }
      } catch (err) {
        if (!alive) return;
        if (isDemoFallback(err)) {
          setTeams(FALLBACK_TEAMS);
          setLoaded(true);
        } else {
          setFailed(true);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [attempt]);

  const openTeam = teams.find((t) => t.id === openTeamId) ?? null;

  const handleAddTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const error = validateTeamForm(form);
    if (error) return showToast(error, "error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.leaderEmail.trim())) {
      return showToast("이메일을 확인해주세요.", "error");
    }
    if (form.initialPassword.length < 8) return showToast("초기 비밀번호는 8자 이상이어야 해요.", "error");
    setSubmitting(true);
    const payload = {
      name: `${form.leaderName.trim()} 팀`,
      workplace: form.workLocation.trim(),
      leaderName: form.leaderName.trim(),
      leaderPhone: form.contact.trim(),
      leaderEmail: form.leaderEmail.trim(),
      initialPassword: form.initialPassword,
      workerCount: form.memberCount.trim() ? Number(form.memberCount.trim()) : 0,
    };
    try {
      const created = await teamsApi.createTeam(payload);
      setTeams((prev) => [...prev, created]);
      showToast(`${created.leaderName} 팀을 추가했어요.`, "success");
      setForm(EMPTY_FORM);
      setAdding(false);
    } catch (err) {
      if (isDemoFallback(err)) {
        setTeams((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            name: `${payload.leaderName} 팀`,
            leaderName: payload.leaderName,
            workLocation: payload.workplace,
            contact: payload.leaderPhone,
            memberCount: payload.workerCount,
            active: true,
            version: 1,
            loginEmail: payload.leaderEmail,
          },
        ]);
        showToast(`${payload.leaderName} 팀을 추가했어요. (데모)`, "success");
        setForm(EMPTY_FORM);
        setAdding(false);
        return;
      }
      showToast(errorMessage(err, "팀 추가에 실패했어요."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    const target = pendingDelete;
    setDeleting(true);
    try {
      await teamsApi.deactivateTeam(target.id);
      setTeams((prev) => prev.filter((t) => t.id !== target.id));
      showToast(`${target.leaderName} 팀을 삭제했어요.`, "success");
    } catch (err) {
      if (isDemoFallback(err)) {
        setTeams((prev) => prev.filter((t) => t.id !== target.id));
        showToast(`${target.leaderName} 팀을 삭제했어요. (데모)`, "success");
      } else {
        showToast(errorMessage(err, "팀 삭제에 실패했어요."), "error");
      }
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const setField = (key: keyof TeamFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <HomeLayout>
      <div className="w-full flex flex-col items-start">
        <SiteManagementHeader active="team" />

        <div className="flex flex-col gap-2 w-full pt-8">
          {!loaded && !failed && <SkeletonList count={3} itemClassName="h-[66px]" />}
          {failed && <LoadError message="팀 목록을 불러오지 못했어요." onRetry={() => setAttempt((n) => n + 1)} />}
          {teams.length > 0 && (
            <div className="hidden md:flex gap-4 px-5 text-xs text-[var(--color-text-faint)]">
              <span className="size-8 shrink-0" aria-hidden="true" />
              <div className="grid grid-cols-4 gap-x-4 flex-1 min-w-0">
                <span>이름</span>
                <span>전화번호</span>
                <span>인원</span>
                <span>이메일</span>
              </div>
              <span className="w-[132px] shrink-0" aria-hidden="true" />
            </div>
          )}
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center px-5 py-4 w-full"
            >
              <div className="bg-[var(--color-bg-tile)] rounded-md flex items-center justify-center size-8 shrink-0 text-[var(--color-text-body)] overflow-hidden">
                <TeamMemberIcon className="size-4" />
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
                <p className="font-['JetBrains_Mono',monospace] leading-4 text-[var(--color-text-body)] text-[11px] self-center truncate" title={team.loginEmail ?? undefined}>
                  {team.loginEmail || "로그인 계정 미등록"}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => setOpenTeamId(team.id)} className={ghostBtn}>
                  정보·계정
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(team)}
                  className="border border-[var(--color-border)] text-[var(--color-danger-text)] text-xs px-3 py-1.5 rounded-md hover:bg-[var(--color-danger-soft-bg)] transition"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
          {loaded && teams.length === 0 && (
            <p className="text-[var(--color-text-faint)] text-sm py-6">등록된 팀이 없어요. 팀 추가 버튼으로 팀을 등록해주세요.</p>
          )}
        </div>

        <button type="button" onClick={() => setAdding(true)} className={`${btnPrimary} mt-6`}>팀 추가</button>

        {adding && (
          <ModalShell title="팀 추가" onClose={closeAdd} busy={submitting} maxWidth={600}
            footer={<>
              <button type="button" onClick={closeAdd} disabled={submitting} className={btnSecondary}>취소</button>
              <button type="submit" form="add-team" disabled={submitting} className={btnPrimary}>{submitting ? "추가 중..." : "팀 추가"}</button>
            </>}
          >
            <form id="add-team" onSubmit={handleAddTeam} noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <label className="flex flex-col gap-1.5">
                  <span className="leading-4 text-[var(--color-text-body)] text-xs">이름 *</span>
                  <input disabled={submitting} type="text" value={form.leaderName} onChange={setField("leaderName")} maxLength={20} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="leading-4 text-[var(--color-text-body)] text-xs">전화번호</span>
                  <input disabled={submitting} type="tel" value={form.contact} onChange={setField("contact")} placeholder="010-0000-0000" className={`${inputCls} placeholder:text-[var(--color-text-faint)]`} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="leading-4 text-[var(--color-text-body)] text-xs">인원</span>
                  <input disabled={submitting} type="text" inputMode="numeric" value={form.memberCount} onChange={setField("memberCount")} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="leading-4 text-[var(--color-text-body)] text-xs">이메일 *</span>
                  <input disabled={submitting} type="email" autoComplete="username" value={form.leaderEmail} onChange={setField("leaderEmail")} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="leading-4 text-[var(--color-text-body)] text-xs">작업 장소</span>
                  <input disabled={submitting} type="text" value={form.workLocation} onChange={setField("workLocation")} maxLength={50} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="leading-4 text-[var(--color-text-body)] text-xs">초기 비밀번호 * (8자 이상)</span>
                  <input disabled={submitting} type="password" autoComplete="new-password" value={form.initialPassword} onChange={setField("initialPassword")} className={inputCls} />
                </label>
              </div>
            </form>
          </ModalShell>
        )}
      </div>

      {openTeam && (
        <TeamDetailModal
          team={openTeam}
          onClose={() => setOpenTeamId(null)}
          onUpdated={(updated) => setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`${pendingDelete.leaderName} 팀을 삭제할까요?`}
          description="팀이 비활성화되고 접속 URL도 더 이상 쓸 수 없어요. 기존 기록은 보관돼요."
          confirmLabel={deleting ? "삭제 중..." : "삭제"}
          destructive
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </HomeLayout>
  );
}
