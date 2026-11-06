import { useRef, useState } from "react";
import { errorMessage, teamsApi } from "../../api";
import type { TeamSummary } from "../../api";
import { useToast } from "../../shared/ui/Toast";
import ModalShell, { btnPrimary, btnSecondary, inputCls } from "../home/ModalShell";

export default function SiteTeamInvitationModal({ team, onClose }: {
  team: TeamSummary;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const generating = useRef(false);

  async function generate() {
    if (generating.current || busy) return;
    generating.current = true;
    setBusy(true);
    setError("");
    setInviteUrl("");
    try {
      const result = await teamsApi.createTeamInvitation(team.id);
      if (typeof result.inviteUrl !== "string" || !result.inviteUrl.trim()) {
        setError("사용할 수 있는 초대 링크를 받지 못했어요. 다시 발급해 주세요.");
        return;
      }
      setInviteUrl(result.inviteUrl);
      showToast(`${team.name} 초대 링크를 발급했어요.`, "success");
    } catch (err) {
      setError(errorMessage(err, "팀 초대 링크 발급에 실패했어요."));
    } finally {
      generating.current = false;
      setBusy(false);
    }
  }

  async function copy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast("초대 링크를 복사했어요. 초대할 팀원에게 전달해 주세요.", "success");
    } catch {
      showToast("초대 링크 입력칸을 선택해 직접 복사해 주세요.", "error");
    }
  }

  async function share() {
    if (!inviteUrl || typeof navigator.share !== "function") return;
    try {
      await navigator.share({ title: `${team.name} 앱 초대`, text: inviteUrl });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        showToast("공유하지 못했어요. 초대 링크를 복사해 전달해 주세요.", "error");
      }
    }
  }

  return (
    <ModalShell
      title={`${team.name} 앱 초대`}
      onClose={onClose}
      busy={busy}
      footer={<button type="button" className={btnSecondary} disabled={busy} onClick={onClose}>닫기</button>}
    >
      <p className="leading-6 text-sm text-[var(--color-text-body)]">
        초대 링크를 발급해 팀원에게 전달해 주세요. 팀원이 앱에서 초대를 수락하면 이 팀에 참여합니다.
      </p>
      <button type="button" className={btnPrimary} disabled={busy} onClick={() => void generate()}>
        {busy ? "발급 중..." : inviteUrl ? "새 링크 발급" : "초대 링크 발급"}
      </button>
      {error && <p role="alert" className="text-sm text-[var(--color-danger-text)]">{error}</p>}
      {inviteUrl && (
        <>
          <label className="flex flex-col gap-2 text-sm text-[var(--color-text-label)]">
            초대 링크
            <input
              className={inputCls}
              readOnly
              value={inviteUrl}
              onFocus={(event) => event.currentTarget.select()}
              aria-label={`${team.name} 초대 링크`}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} disabled={busy} onClick={() => void copy()}>링크 복사</button>
            {typeof navigator.share === "function" && (
              <button type="button" className={btnSecondary} disabled={busy} onClick={() => void share()}>공유하기</button>
            )}
          </div>
          <p className="text-xs leading-5 text-[var(--color-text-body)]">링크 발급만으로 참여가 완료되지는 않아요. 팀원이 앱에서 초대를 수락해야 합니다.</p>
        </>
      )}
    </ModalShell>
  );
}
