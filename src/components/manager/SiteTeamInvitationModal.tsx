import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage, teamsApi } from "../../api";
import type { TeamSummary } from "../../api";
import { useToast } from "../../shared/ui/Toast";
import ModalShell, { btnPrimary, btnSecondary, inputCls } from "../home/ModalShell";
import { useSiteMe } from "../../hooks/useSiteMe";

export default function SiteTeamInvitationModal({ team, onClose, autoGenerate = false }: {
  team: TeamSummary;
  onClose: () => void;
  autoGenerate?: boolean;
}) {
  const { showToast } = useToast();
  const me = useSiteMe();
  const inviteDisplayName = me.site.name?.trim() || team.workLocation?.trim() || "현장";
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const generating = useRef(false);
  const autoStarted = useRef(false);

  const generate = useCallback(async () => {
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
      showToast(`${inviteDisplayName} 초대 링크를 발급했어요.`, "success");
    } catch (err) {
      setError(errorMessage(err, "팀 초대 링크 발급에 실패했어요."));
    } finally {
      generating.current = false;
      setBusy(false);
    }
  }, [busy, inviteDisplayName, showToast, team.id]);

  useEffect(() => {
    if (!autoGenerate || autoStarted.current) return;
    autoStarted.current = true;
    void generate();
  }, [autoGenerate, generate]);

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
      await navigator.share({ title: `${inviteDisplayName} 앱 초대`, text: inviteUrl });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        showToast("공유하지 못했어요. 초대 링크를 복사해 전달해 주세요.", "error");
      }
    }
  }

  return (
    <ModalShell
      title={`${inviteDisplayName} 앱 초대`}
      onClose={onClose}
      busy={busy}
      footer={<button type="button" className={btnSecondary} disabled={busy} onClick={onClose}>닫기</button>}
    >
      <p className="text-sm leading-6 text-[var(--color-text-body)]">
        앱에서 초대를 수락하면 이 현장에 참여합니다.
      </p>
      {!inviteUrl && (
        <button type="button" className={btnPrimary} disabled={busy} onClick={() => void generate()}>
          {busy ? "발급 중..." : "초대 링크 발급"}
        </button>
      )}
      {error && <p role="alert" className="text-sm text-[var(--color-danger-text)]">{error}</p>}
      {inviteUrl && (
        <>
          <label className="flex flex-col gap-2 text-sm text-[var(--color-text-label)]">
            초대 링크
            <div className="relative">
              <input
                className={`${inputCls} pr-11`}
                readOnly
                value={inviteUrl}
                onFocus={(event) => event.currentTarget.select()}
                aria-label={`${inviteDisplayName} 초대 링크`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r border-l border-[var(--home-card-border)] text-[var(--color-accent)] transition hover:bg-[var(--color-bg-tile)] disabled:opacity-60"
                disabled={busy}
                onClick={() => void copy()}
                aria-label="초대 링크 복사"
                title="초대 링크 복사"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="8" y="8" width="13" height="13" rx="2" />
                  <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                </svg>
              </button>
            </div>
          </label>
          <button type="button" className={btnPrimary} disabled={busy} onClick={() => void generate()}>
            {busy ? "발급 중..." : "새 링크 발급"}
          </button>
          {typeof navigator.share === "function" && (
            <button type="button" className={`${btnSecondary} border-[var(--color-accent)]`} disabled={busy} onClick={() => void share()}>
              공유하기
            </button>
          )}
        </>
      )}
    </ModalShell>
  );
}
