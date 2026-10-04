import { useState } from "react";
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
  const [editingCredentials, setEditingCredentials] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [form, setForm] = useState({
    leaderName: team.leaderName,
    workLocation: team.workLocation ?? "",
    contact: team.contact ?? "",
    memberCount: team.memberCount ? String(team.memberCount) : "",
  });
  const [credentials, setCredentials] = useState({ leaderEmail: team.loginEmail ?? "", newPassword: "" });

  useEscapeKey(saving || savingCredentials ? undefined : onClose);

  const save = async () => {
    const error = validateTeamForm(form);
    if (error) return showToast(error, "error");
    const payload: UpdateTeamPayload = {
      name: team.name,
      workplace: form.workLocation.trim(),
      leaderName: form.leaderName.trim(),
      leaderPhone: form.contact.trim(),
      workerCount: form.memberCount.trim() ? Number(form.memberCount) : team.memberCount,
      version: team.version,
    };
    setSaving(true);
    try {
      const updated = await teamsApi.updateTeam(team.id, payload);
      onUpdated(updated);
      showToast("팀 정보를 저장했어요.", "success");
      setEditing(false);
    } catch (err) {
      if (isDemoFallback(err)) {
        onUpdated({
          ...team,
          name: payload.name ?? team.name,
          workLocation: payload.workplace ?? team.workLocation,
          leaderName: payload.leaderName ?? team.leaderName,
          contact: payload.leaderPhone ?? team.contact,
          memberCount: payload.workerCount ?? team.memberCount,
        });
        showToast("팀 정보를 저장했어요. (데모)", "success");
        setEditing(false);
      } else {
        showToast(errorMessage(err, "저장에 실패했어요."), "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const saveCredentials = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.leaderEmail.trim())) {
      return showToast("팀장 로그인 이메일을 확인해주세요.", "error");
    }
    if (credentials.newPassword.length < 8) return showToast("새 비밀번호는 8자 이상이어야 해요.", "error");
    setSavingCredentials(true);
    try {
      const res = await teamsApi.updateTeamCredentials(team.id, {
        leaderEmail: credentials.leaderEmail.trim(),
        newPassword: credentials.newPassword,
      });
      onUpdated({ ...team, loginEmail: res.loginEmail });
      setCredentials((current) => ({ ...current, newPassword: "" }));
      setEditingCredentials(false);
      showToast("팀원 로그인 정보를 변경했어요. 기존 로그인 세션은 종료됐어요.", "success");
    } catch (err) {
      if (isDemoFallback(err)) {
        onUpdated({ ...team, loginEmail: credentials.leaderEmail.trim() });
        setCredentials((current) => ({ ...current, newPassword: "" }));
        setEditingCredentials(false);
        showToast("팀원 로그인 정보를 변경했어요. (데모)", "success");
      } else {
        showToast(errorMessage(err, "로그인 정보 변경에 실패했어요."), "error");
      }
    } finally {
      setSavingCredentials(false);
    }
  };

  const rows = [
    { key: "name", label: "팀명", value: team.name },
    { key: "workLocation", label: "작업 장소", value: team.workLocation || "미지정" },
    { key: "contact", label: "연락처", value: team.contact || "-" },
    { key: "memberCount", label: "작업 인원", value: team.memberCount ? `${team.memberCount}명` : "-" },
    { key: "loginEmail", label: "로그인 이메일", value: team.loginEmail || "계정 미등록" },
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
            {editing ? "팀 정보 수정" : editingCredentials ? "팀원 로그인 정보 변경" : `${team.name} 정보`}
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

        {editingCredentials ? (
          <div className="flex flex-col p-5 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[var(--color-text-body)] text-xs">팀장 로그인 이메일 *</span>
              <input
                type="email"
                autoComplete="username"
                value={credentials.leaderEmail}
                onChange={(e) => setCredentials((current) => ({ ...current, leaderEmail: e.target.value }))}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[var(--color-text-body)] text-xs">새 비밀번호 * (8자 이상)</span>
              <input
                type="password"
                autoComplete="new-password"
                value={credentials.newPassword}
                onChange={(e) => setCredentials((current) => ({ ...current, newPassword: e.target.value }))}
                className={inputCls}
              />
            </label>
          </div>
        ) : editing ? (
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
          </div>
        )}

        <div className="border-[var(--color-border)] border-t flex justify-end gap-2 px-5 py-4">
          {editingCredentials ? (
            <>
              <button
                type="button"
                onClick={() => setEditingCredentials(false)}
                disabled={savingCredentials}
                className="border border-[var(--color-border)] text-[var(--color-text-label)] text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-bg-tile)] transition disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveCredentials}
                disabled={savingCredentials}
                className="bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-2 rounded-lg hover:brightness-110 transition disabled:opacity-60"
              >
                {savingCredentials ? "변경 중..." : "로그인 정보 변경"}
              </button>
            </>
          ) : editing ? (
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
                onClick={() => setEditingCredentials(true)}
                className="border border-[var(--color-border)] text-[var(--color-text-label)] text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-bg-tile)] transition"
              >
                로그인 정보 변경
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="border border-[var(--color-border)] text-[var(--color-text-label)] text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-bg-tile)] transition"
              >
                팀 정보 수정
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

    </div>
  );
}
