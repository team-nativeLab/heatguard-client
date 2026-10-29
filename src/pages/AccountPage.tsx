import { useState, type ReactNode } from "react";
import HomeLayout from "../components/home/HomeLayout";
import ModalShell, { btnPrimary, btnSecondary, inputCls } from "../components/home/ModalShell";
import { useToast } from "../shared/ui/Toast";
import { useSiteMe, patchSiteMeUser } from "../hooks/useSiteMe";
import { authApi, siteApi, errorMessage } from "../api";
import { getPasswordConfirmationError, getPasswordError } from "../lib/passwordPolicy";
import { NewPasswordInput } from "../components/auth/NewPasswordField";
import { usePasswordComposition } from "../components/auth/usePasswordComposition";

const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

const smallBtn =
  "shrink-0 rounded border border-[var(--home-card-border)] bg-[var(--home-card-bg)] px-3.5 py-1.5 text-[13px] font-normal leading-[1.45] text-[var(--color-text-label)] transition hover:bg-[var(--color-bg-tile)]";

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[var(--home-card-border)] bg-[var(--home-card-bg)]">
      <div className="flex flex-col gap-0.5 px-5 py-4 leading-[1.45]">
        <h2 className="text-[15px] font-medium text-[var(--color-text-heading)]">{title}</h2>
        <p className="text-xs text-[var(--color-text-body)]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, sub, action }: { label: string; value: ReactNode; sub?: string; action: ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-t border-[var(--home-card-border)] px-5 py-3.5">
      <span className="w-[88px] shrink-0 text-[13px] leading-[1.45] text-[var(--color-text-body)] sm:w-[120px]">{label}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.45]">
        <span className="truncate text-sm font-normal text-[var(--color-text-heading)]">{value}</span>
        {sub && <span className="text-xs text-[var(--color-text-faint)]">{sub}</span>}
      </div>
      {action}
    </div>
  );
}

const fixedNote = <span className="shrink-0 text-xs leading-[1.45] text-[var(--color-text-faint)]">변경 불가</span>;

export default function AccountPage() {
  const me = useSiteMe();
  const [changingPw, setChangingPw] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);

  return (
    <HomeLayout>
      <div className="flex w-full justify-center">
        <div className="flex w-full max-w-[695px] flex-col gap-6">
          <div className="flex flex-col gap-1 leading-[1.45]">
            <h1 className="text-xl font-medium text-[var(--color-text-heading)]">계정 설정</h1>
            <p className="text-[13px] text-[var(--color-text-body)]">내 정보와 로그인 보안을 관리할 수 있어요.</p>
          </div>

          <Card title="기본 정보" description="현장 관리자 계정 정보예요.">
            <Row
              label="이름"
              value={me.user.name}
              action={
                fixedNote
              }
            />
            <Row label="아이디" value={me.user.email || "-"} action={fixedNote} />
            <Row
              label="연락처"
              value={me.user.phone || "등록된 연락처가 없어요"}
              action={
                <button type="button" onClick={() => setEditingPhone(true)} className={smallBtn}>
                  변경
                </button>
              }
            />
            <Row label="소속 현장" value={me.site.name || "-"} sub="소속 변경은 본사에 요청해 주세요." action={fixedNote} />
          </Card>

          <Card title="로그인 보안" description="주기적으로 비밀번호를 바꾸면 계정을 안전하게 지킬 수 있어요.">
            <Row
              label="비밀번호"
              value="••••••••"
              action={
                <button type="button" onClick={() => setChangingPw(true)} className={smallBtn}>
                  변경
                </button>
              }
            />
          </Card>
        </div>
      </div>

      {changingPw && <PasswordModal onClose={() => setChangingPw(false)} />}
      {editingPhone && <PhoneModal initial={me.user.phone ?? ""} onClose={() => setEditingPhone(false)} />}
    </HomeLayout>
  );
}

function PhoneModal({ initial, onClose }: { initial: string; onClose: () => void }) {
  const { showToast } = useToast();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    const v = value.trim();
    if (!PHONE_RE.test(v)) return setError("연락처 형식을 확인해 주세요. (예: 010-1234-5678)");
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      // 명세상 연락처는 현장 기본정보(PATCH /site/profile)로 수정한다. version이 필요해 먼저 조회한다.
      const profile = await siteApi.getProfile();
      await siteApi.updateProfile({ managerPhone: v, version: profile.version });
      patchSiteMeUser({ phone: v });
      showToast("연락처를 변경했어요.", "success");
      onClose();
    } catch (err) {
      showToast(errorMessage(err, "연락처 변경에 실패했어요."), "error");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="연락처 변경"
      maxWidth={440}
      onClose={onClose}
      busy={submitting}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={btnSecondary}>
            취소
          </button>
          <button type="button" onClick={handleSave} disabled={submitting} className={btnPrimary}>
            {submitting ? "변경 중..." : "변경"}
          </button>
        </>
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-normal leading-[1.45] text-[var(--color-text-label)]">연락처</span>
        <input
          autoFocus
          type="tel"
          maxLength={13}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="010-0000-0000"
          className={inputCls}
        />
        {error && <span className="text-[11px] leading-[1.45] text-[var(--color-danger-text)]">{error}</span>}
      </label>
    </ModalShell>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const passwordComposition = usePasswordComposition();

  const handleChange = async () => {
    if (submitting || passwordComposition.isComposing()) return;
    const next: typeof errors = {};
    if (!currentPw) next.current = "현재 비밀번호를 입력해 주세요.";
    const passwordError = getPasswordError(newPw);
    const confirmationError = getPasswordConfirmationError(newPw, confirmPw);
    if (passwordError) next.next = passwordError;
    if (confirmationError) next.confirm = confirmationError;
    setErrors(next);
    if (Object.keys(next).length > 0 || submitting) return;

    setSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      showToast("비밀번호를 변경했어요.", "success");
      onClose();
    } catch (err) {
      showToast(errorMessage(err, "비밀번호 변경에 실패했어요."), "error");
      setSubmitting(false);
    }
  };

  const label = "text-xs font-normal leading-[1.45] text-[var(--color-text-label)]";
  const errCls = "text-[11px] leading-[1.45] text-[var(--color-danger-text)]";

  return (
    <ModalShell
      title="비밀번호 변경"
      maxWidth={440}
      onClose={onClose}
      busy={submitting}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={btnSecondary}>
            취소
          </button>
          <button type="button" onClick={handleChange} disabled={submitting} className={btnPrimary}>
            {submitting ? "변경 중..." : "변경"}
          </button>
        </>
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className={label}>현재 비밀번호</span>
        <input type="password" autoComplete="current-password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="현재 비밀번호 입력" className={inputCls} />
        {errors.current && <span className={errCls}>{errors.current}</span>}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={label}>새 비밀번호</span>
        <NewPasswordInput
          aria-label="새 비밀번호"
          value={newPw}
          onChange={(e) => {
            setNewPw(e.target.value);
            setErrors((previous) => ({ ...previous, next: undefined }));
          }}
          placeholder="새 비밀번호 입력"
          className={inputCls}
          error={errors.next}
          {...passwordComposition.inputProps}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={label}>새 비밀번호 확인</span>
        <NewPasswordInput
          aria-label="새 비밀번호 확인"
          confirmation
          value={confirmPw}
          onChange={(e) => {
            setConfirmPw(e.target.value);
            setErrors((previous) => ({ ...previous, confirm: undefined }));
          }}
          {...passwordComposition.inputProps}
          onKeyDown={(e) => {
            passwordComposition.inputProps.onKeyDown(e);
            if (!e.defaultPrevented && e.key === "Enter") void handleChange();
          }}
          placeholder="새 비밀번호 다시 입력"
          className={inputCls}
          error={errors.confirm}
        />
      </label>
    </ModalShell>
  );
}
