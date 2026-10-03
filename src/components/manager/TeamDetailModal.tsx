import { useState } from "react";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import { useToast } from "../../shared/ui/Toast";
import { useEscapeKey } from "../../shared/ui/useEscapeKey";
import { CloseIcon } from "../icons/Icons";
import { teamsApi, isDemoFallback, errorMessage, type TeamSummary, type UpdateTeamPayload } from "../../api";
import { validateTeamForm } from "../../lib/teamForm";

const inputCls =
  "bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[36px] w-full px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors";

export default function TeamDetailModal({
  team,
  onClose,
  onUpdated,
}: {
  team: TeamSummary;
  onClose: () => void;
  onUpdated: (team: TeamSummary) => void;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [form, setForm] = useState({
    leaderName: team.leaderName,
    workLocation: team.workLocation ?? "",
    contact: team.contact ?? "",
    memberCount: team.memberCount ? String(team.memberCount) : "",
  });

  useEscapeKey(confirmRotate || saving ? undefined : onClose);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(team.accessUrl);
      showToast("접속 URL을 복사했어요.", "success");
    } catch {
      showToast("복사하지 못했어요. URL을 직접 선택해 복사해주세요.", "error");
    }
  };

  const save = async () => {
    const error = validateTeamForm(form);
    if (error) return showToast(error, "error");
    const payload: UpdateTeamPayload = {
      leaderName: form.leaderName.trim(),
      workLocation: form.workLocation.trim(),
      contact: form.contact.trim(),
      memberCount: form.memberCount.trim() ? Number(form.memberCount) : undefined,
    };
    setSaving(true);
    try {
      const updated = await teamsApi.updateTeam(team.id, payload);
      onUpdated(updated);
      showToast("팀 정보를 저장했어요.", "success");
      setEditing(false);
    } catch (err) {
      if (isDemoFallback(err)) {
        onUpdated({ ...team, ...payload, memberCount: payload.memberCount ?? 0 });
        showToast("팀 정보를 저장했어요. (데모)", "success");
        setEditing(false);
      } else {
        showToast(errorMessage(err, "저장에 실패했어요."), "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const rotate = async () => {
    setRotating(true);
    try {
      const res = await teamsApi.rotateTeamToken(team.id);
      onUpdated({ ...team, accessUrl: res.accessUrl });
      showToast("새 접속 URL을 발급했어요. 기존 URL은 더 이상 쓸 수 없어요.", "success");
    } catch (err) {
      if (isDemoFallback(err)) {
        const base = team.accessUrl.replace(/[^/]+$/, "");
        onUpdated({ ...team, accessUrl: `${base}${Math.random().toString(36).slice(2, 8)}` });
        showToast("새 접속 URL을 발급했어요. (데모)", "success");
      } else {
        showToast(errorMessage(err, "URL 재발급에 실패했어요."), "error");
      }
    } finally {
      setRotating(false);
      setConfirmRotate(false);
    }
  };

  const rows = [
    { key: "workLocation", label: "작업 장소", value: team.workLocation || "미지정" },
    { key: "contact", label: "연락처", value: team.contact || "-" },
    { key: "memberCount", label: "작업 인원", value: team.memberCount ? `${team.memberCount}명` : "-" },
  ] as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${team.leaderName} 팀 정보`}
      className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-[90] px-4 animate-[fadeIn_0.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-[440px] overflow-hidden">
        <div className="border-[var(--color-border)] border-b flex items-center justify-between px-5 py-4">
          <h3 className="font-semibold text-[var(--color-text-heading)] text-base">
            {editing ? "팀 정보 수정" : `${team.leaderName} 팀`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex items-center justify-center size-7 rounded-md text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-tile)] transition"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        {editing ? (
          <div className="flex flex-col p-5 gap-3">
            {(
              [
                ["leaderName", "팀장 이름 *", "text"],
                ["workLocation", "작업 장소", "text"],
                ["contact", "연락처", "tel"],
                ["memberCount", "작업 인원", "text"],
              ] as const
            ).map(([key, label, type]) => (
              <label key={key} className="flex flex-col gap-1.5">
                <span className="text-[var(--color-text-body)] text-xs">{label}</span>
                <input
                  type={type}
                  inputMode={key === "memberCount" ? "numeric" : undefined}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && save()}
                  className={inputCls}
                />
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-col p-5 gap-3">
            {rows.map((row) => (
              <div key={row.key} className="flex gap-3">
                <span className="w-20 shrink-0 text-[var(--color-text-body)] text-xs pt-0.5">{row.label}</span>
                <span className="text-[var(--color-text-heading)] text-sm break-all">{row.value}</span>
              </div>
            ))}
            <div className="flex gap-3">
              <span className="w-20 shrink-0 text-[var(--color-text-body)] text-xs pt-0.5">접속 URL</span>
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <span className="font-['JetBrains_Mono',monospace] text-[var(--color-text-heading)] text-xs break-all">
                  {team.accessUrl}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="border border-[var(--color-border)] text-[var(--color-text-label)] text-xs px-2.5 py-1 rounded-md hover:bg-[var(--color-bg-tile)] transition"
                  >
                    복사
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRotate(true)}
                    className="border border-[var(--color-border)] text-[var(--color-text-label)] text-xs px-2.5 py-1 rounded-md hover:bg-[var(--color-bg-tile)] transition"
                  >
                    URL 재발급
                  </button>
                </div>
              </div>
            </div>
            {team.qrCodeUrl && (
              <div className="flex gap-3">
                <span className="w-20 shrink-0 text-[var(--color-text-body)] text-xs pt-0.5">접속 QR</span>
                <img src={team.qrCodeUrl} alt={`${team.leaderName} 팀 접속 QR 코드`} className="size-28 rounded-md border border-[var(--color-border)] bg-white p-1" />
              </div>
            )}
          </div>
        )}

        <div className="border-[var(--color-border)] border-t flex justify-end gap-2 px-5 py-4">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="border border-[var(--color-border)] text-[var(--color-text-label)] text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-bg-tile)] transition disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-2 rounded-lg hover:brightness-110 transition disabled:opacity-60"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="border border-[var(--color-border)] text-[var(--color-text-label)] text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-bg-tile)] transition"
              >
                수정
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-[var(--color-bg-tile)] text-[var(--color-text-label)] text-sm px-4 py-2 rounded-lg hover:brightness-95 transition"
              >
                닫기
              </button>
            </>
          )}
        </div>
      </div>

      {confirmRotate && (
        <ConfirmDialog
          title="접속 URL을 재발급할까요?"
          description={"재발급하면 기존 URL과 QR 코드로는 더 이상 접속할 수 없어요.\n팀원에게 새 URL을 다시 공유해주세요."}
          confirmLabel={rotating ? "발급 중..." : "재발급"}
          busy={rotating}
          onCancel={() => setConfirmRotate(false)}
          onConfirm={rotate}
        />
      )}
    </div>
  );
}
