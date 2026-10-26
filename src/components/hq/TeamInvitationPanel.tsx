import { useEffect, useRef, useState } from "react";
import { errorMessage, hqApi, type HqSiteDetail } from "../../api";
import type { TeamInvitation } from "../../api/hq";
import { useToast } from "../../shared/ui/Toast";
import { btnPrimary, btnSecondary, inputCls } from "../home/ModalShell";

type IssuedInvitation = TeamInvitation & { teamId: string };

function isUsable(invitation: IssuedInvitation | null) {
  return !!invitation && typeof invitation.inviteUrl === "string" && !!invitation.inviteUrl.trim();
}

export default function TeamInvitationPanel({ siteId, active, teams }: {
  siteId: string;
  active: boolean;
  teams: HqSiteDetail["teams"];
}) {
  const { showToast } = useToast();
  const [teamId, setTeamId] = useState("");
  const [invitation, setInvitation] = useState<IssuedInvitation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const generating = useRef(false);
  const selectableTeams = teams.filter((team) => team.id);
  const selectedTeam = selectableTeams.find((team) => team.id === teamId);
  const selectedTeamId = selectedTeam?.id ?? "";
  const selectedTeamName = selectedTeam?.name ?? "";
  const currentInvitation = selectedTeam && invitation?.teamId === selectedTeam.id ? invitation : null;
  const usable = active && isUsable(currentInvitation);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function generate() {
    if (generating.current || !active || !selectedTeamId) return;
    generating.current = true;
    setBusy(true);
    setError("");
    setInvitation(null);
    try {
      const result = await hqApi.createTeamInvitation(siteId, selectedTeamId);
      if (!mounted.current) return;
      const issued = { ...result, teamId: selectedTeamId };
      if (!isUsable(issued)) {
        setError("사용할 수 있는 초대 링크를 받지 못했어요. 다시 발급해 주세요.");
        return;
      }
      setInvitation(issued);
      showToast(`${selectedTeamName} 초대 링크를 발급했어요.`, "success");
    } catch (err) {
      if (mounted.current) setError(errorMessage(err, "팀 초대 링크 발급에 실패했어요."));
    } finally {
      generating.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function copy() {
    if (!active || !isUsable(currentInvitation) || !currentInvitation) return;
    try {
      await navigator.clipboard.writeText(currentInvitation.inviteUrl);
      showToast("초대 링크를 복사했어요. 초대할 팀원에게 전달해 주세요.", "success");
    } catch { showToast("초대 링크 입력칸을 선택해 직접 복사해 주세요.", "error"); }
  }

  async function share() {
    if (!active || !isUsable(currentInvitation) || !currentInvitation) return;
    try { await navigator.share({ title: "폭염가드 팀 초대", text: currentInvitation.inviteUrl }); }
    catch (err) { if (!(err instanceof DOMException && err.name === "AbortError")) showToast("공유하지 못했어요. 초대 링크를 복사해 전달해 주세요.", "error"); }
  }

  return <section className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 text-sm text-[var(--color-text-body)]">
    <h2 className="font-semibold text-[var(--color-text-heading)]">앱 팀 초대</h2>
    <p className="py-3 leading-6">초대할 팀을 선택하고 링크를 발급해 팀원에게 전달해 주세요. 초대받은 사용자가 앱에서 팀 초대를 수락하면 해당 팀에 참여할 수 있어요.</p>
    {selectableTeams.length === 0 ? <p>등록된 팀이 없어요. 현장관리자가 팀을 등록한 뒤 초대 링크를 발급할 수 있어요.</p> : <>
      <label className="flex max-w-[440px] flex-col gap-2">초대할 팀
        <select className={inputCls} value={selectedTeam?.id ?? ""} disabled={busy || !active} onChange={(event) => {
          setTeamId(event.target.value);
          setInvitation(null);
          setError("");
        }}>
          <option value="">팀을 선택해 주세요</option>
          {selectableTeams.map((team) => <option key={team.id} value={team.id}>{team.name}{team.leaderName ? ` · ${team.leaderName}` : ""}</option>)}
        </select>
      </label>
      <button type="button" className={`${btnPrimary} mt-3`} disabled={busy || !active || !selectedTeam} onClick={generate}>{busy ? "발급 중..." : "팀 초대 링크 발급"}</button>
    </>}
    {!active && <p className="pt-2">비활성 현장은 팀 초대 링크를 발급할 수 없어요.</p>}
    {error && <p role="alert" className="pt-3 text-[var(--color-danger-text)]">{error}</p>}
    {currentInvitation && <div className="mt-4 flex flex-col gap-3 rounded-lg bg-[var(--color-bg-tile)] p-4">
      <p className="font-medium text-[var(--color-text-heading)]">{selectedTeam?.name} 초대 링크</p>
      <label className="flex flex-col gap-2">초대 링크
        <input className={inputCls} readOnly value={usable ? currentInvitation.inviteUrl : ""} onFocus={(event) => event.currentTarget.select()} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnSecondary} disabled={!usable || busy} onClick={() => void copy()}>초대 링크 복사</button>
        {typeof navigator.share === "function" && <button type="button" className={btnSecondary} disabled={!usable || busy} onClick={() => void share()}>공유하기</button>}
      </div>
      <p className="text-xs leading-5">카카오톡이나 문자 등으로 직접 전달해 주세요. 링크 발급만으로 팀 참여가 완료되지는 않아요.</p>
    </div>}
  </section>;
}
