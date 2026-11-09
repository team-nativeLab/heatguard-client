import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import HomeLayout from "../components/home/HomeLayout";
import ModalShell, { btnPrimary, btnSecondary, inputCls } from "../components/home/ModalShell";
import ConfirmDialog from "../shared/ui/ConfirmDialog";
import { useToast } from "../shared/ui/Toast";
import { useSiteMe, patchSiteMeUser } from "../hooks/useSiteMe";
import { authApi, siteApi, isDemoFallback, errorMessage } from "../api";
import { markSignedOut } from "../shared/auth/RequireAuth";
import { clearSiteMeCache } from "../hooks/useSiteMe";
import { clearSelectedSiteId } from "../lib/siteSelection";
import { getPasswordConfirmationError, getPasswordError } from "../lib/passwordPolicy";
import { NewPasswordInput } from "../components/auth/NewPasswordField";
import { usePasswordComposition } from "../components/auth/usePasswordComposition";
import { useTheme } from "../shared/theme/ThemeContext";

const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

const smallBtn =
  "shrink-0 rounded border border-black bg-[var(--home-card-bg)] px-3.5 py-1.5 text-[13px] font-normal leading-[1.45] text-[var(--color-text-heading)] transition hover:bg-[var(--color-bg-tile)]";
const destructiveBtn =
  "shrink-0 rounded border border-[var(--color-danger-text)] bg-[var(--color-danger-text)] px-3.5 py-1.5 text-[13px] font-medium leading-[1.45] text-white transition hover:brightness-90";

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
        {value ? <span className="truncate text-sm font-normal text-[var(--color-text-heading)]">{value}</span> : null}
        {sub && <span className="text-xs text-[var(--color-text-faint)]">{sub}</span>}
      </div>
      {action}
    </div>
  );
}

const fixedNote = <span className="shrink-0 text-xs leading-[1.45] text-[var(--color-text-faint)]">변경 불가</span>;

export default function AccountPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const me = useSiteMe();
  const [changingPw, setChangingPw] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [confirmingWithdrawal, setConfirmingWithdrawal] = useState(false);
  const [withdrawalPassword, setWithdrawalPassword] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // 네트워크가 끊겨도 로컬 세션은 종료한다.
    } finally {
      clearSiteMeCache();
      authApi.clearManagedSitesCache();
      clearSelectedSiteId();
      markSignedOut();
      showToast("로그아웃했어요.");
      navigate("/auth/login", { replace: true });
      setLoggingOut(false);
      setConfirmingLogout(false);
    }
  };

  const withdraw = async () => {
    if (withdrawing) return;
    if (!withdrawalPassword) return showToast("현재 비밀번호를 입력해주세요.", "error");
    setWithdrawing(true);
    try {
      await siteApi.withdraw({ currentPassword: withdrawalPassword });
      clearSiteMeCache();
      markSignedOut();
      showToast("회원탈퇴가 처리됐어요.");
      navigate("/auth/login", { replace: true });
    } catch (err) {
      if (isDemoFallback(err)) {
        clearSiteMeCache();
        markSignedOut();
        showToast("회원탈퇴가 처리됐어요. (데모)");
        navigate("/auth/login", { replace: true });
        return;
      }
      showToast(errorMessage(err, "탈퇴 처리에 실패했어요."), "error");
      setWithdrawalPassword("");
    } finally {
      setWithdrawing(false);
    }
  };

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
                <button type="button" onClick={() => setEditingName(true)} className={smallBtn}>
                  변경
                </button>
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
            <Row label="현재 선택 현장" value={me.site.name || "-"} sub="여러 현장을 관리하는 경우 왼쪽 메뉴에서 전환할 수 있어요." action={fixedNote} />
          </Card>

          <Card title="화면 테마" description="원하는 화면 모드를 선택할 수 있어요.">
            <div className="flex items-center justify-between gap-4 border-t border-[var(--home-card-border)] px-5 py-3.5">
              <span className="text-[13px] text-[var(--color-text-body)]">화면 모드</span>
              <div role="group" aria-label="화면 모드 선택" className="flex gap-2">
                <button
                  type="button"
                  aria-pressed={theme === "light"}
                  onClick={() => theme !== "light" && toggleTheme()}
                  className={`rounded border px-3.5 py-1.5 text-[13px] transition ${theme === "light" ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white" : "border-[var(--home-card-border)] bg-[var(--home-card-bg)] text-[var(--color-text-label)] hover:bg-[var(--color-bg-tile)]"}`}
                >
                  라이트
                </button>
                <button
                  type="button"
                  aria-pressed={theme === "dark"}
                  onClick={() => theme !== "dark" && toggleTheme()}
                  className={`rounded border px-3.5 py-1.5 text-[13px] transition ${theme === "dark" ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white" : "border-[var(--home-card-border)] bg-[var(--home-card-bg)] text-[var(--color-text-label)] hover:bg-[var(--color-bg-tile)]"}`}
                >
                  다크
                </button>
              </div>
            </div>
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
            <Row
              label="로그아웃"
              value=""
              action={
                <button type="button" onClick={() => setConfirmingLogout(true)} className={smallBtn}>
                  로그아웃
                </button>
              }
            />
          </Card>

          <Card title="회원 탈퇴" description="탈퇴 시 계정·현장·팀은 비활성화되고, 기록·사진은 365일 보관 후 삭제됩니다.">
            <div className="flex items-center justify-between gap-4 border-t border-[var(--home-card-border)] px-5 py-3.5">
              <span className="text-xs text-[var(--color-text-body)]">탈퇴하려면 현재 비밀번호를 확인해야 합니다.</span>
              <button type="button" onClick={() => setConfirmingWithdrawal(true)} className={destructiveBtn}>
                회원 탈퇴
              </button>
            </div>
          </Card>
        </div>
      </div>

      {editingName && <NameModal initial={me.user.name} onClose={() => setEditingName(false)} />}
      {changingPw && <PasswordModal onClose={() => setChangingPw(false)} />}
      {editingPhone && <PhoneModal initial={me.user.phone ?? ""} onClose={() => setEditingPhone(false)} />}
      {confirmingLogout && (
        <ConfirmDialog
          title="로그아웃할까요?"
          confirmLabel={loggingOut ? "로그아웃 중..." : "로그아웃"}
          busy={loggingOut}
          onCancel={() => setConfirmingLogout(false)}
          onConfirm={logout}
        />
      )}
      {confirmingWithdrawal && (
        <ConfirmDialog
          title="정말 탈퇴할까요?"
          description="현재 비밀번호를 확인해야 탈퇴가 진행됩니다. 기록·사진은 365일간 보관 후 완전삭제돼요."
          confirmLabel={withdrawing ? "처리 중..." : "탈퇴"}
          destructive
          busy={withdrawing}
          onCancel={() => { setConfirmingWithdrawal(false); setWithdrawalPassword(""); }}
          onConfirm={withdraw}
        >
          <input
            type="password"
            autoFocus
            value={withdrawalPassword}
            onChange={(event) => setWithdrawalPassword(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void withdraw()}
            placeholder="현재 비밀번호"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[38px] w-full px-3 text-sm text-[var(--color-text-heading)] placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] transition-colors mt-3"
          />
        </ConfirmDialog>
      )}
    </HomeLayout>
  );
}

function NameModal({ initial, onClose }: { initial: string; onClose: () => void }) {
  const { showToast } = useToast();
  const [value, setValue] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    const name = value.trim();
    if (!name) return showToast("이름을 입력해주세요.", "error");
    if (name.length > 20) return showToast("이름은 20자 이내로 입력해주세요.", "error");
    if (submitting) return;
    setSubmitting(true);
    try {
      const updated = await authApi.updateProfile({ name });
      patchSiteMeUser({ name: updated.name || name });
      showToast("이름을 변경했어요.", "success");
      onClose();
    } catch (err) {
      if (isDemoFallback(err)) {
        patchSiteMeUser({ name });
        showToast("이름을 변경했어요. (데모)", "success");
        onClose();
        return;
      }
      showToast(errorMessage(err, "이름 변경에 실패했어요."), "error");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="이름 변경"
      maxWidth={440}
      onClose={onClose}
      busy={submitting}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={btnSecondary}>취소</button>
          <button type="button" onClick={handleSave} disabled={submitting} className={btnPrimary}>{submitting ? "변경 중..." : "저장"}</button>
        </>
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs leading-[1.45] text-[var(--color-text-label)]">이름</span>
        <input
          autoFocus
          maxLength={20}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && void handleSave()}
          className={inputCls}
        />
      </label>
    </ModalShell>
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

