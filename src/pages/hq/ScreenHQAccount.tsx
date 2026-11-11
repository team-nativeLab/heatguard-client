import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import HQLayout, { HQContent } from "../../components/hq/HQLayout";
import ModalShell, { btnPrimary, btnSecondary, inputCls } from "../../components/hq/ModalShell";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import { useToast } from "../../shared/ui/Toast";
import { hqApi, ApiError, errorMessage } from "../../api";
import { clearHqMeCache, patchHqCompany, patchHqUser, useHqMe } from "../../hooks/useHqMe";
import { markSignedOut } from "../../shared/auth/RequireAuth";
import { getPasswordConfirmationError, getPasswordError } from "../../lib/passwordPolicy";
import { NewPasswordInput } from "../../components/auth/NewPasswordField";
import { usePasswordComposition } from "../../components/auth/usePasswordComposition";
import { useTheme } from "../../shared/theme/ThemeContext";
import EmailChangeModal from "../../components/account/EmailChangeModal";

const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  const prefixLength = digits.startsWith("02") ? 2 : 3;
  const middleLength = prefixLength === 2 || digits.length >= 11 ? 4 : 3;
  const prefix = digits.slice(0, prefixLength);
  const middle = digits.slice(prefixLength, prefixLength + middleLength);
  const last = digits.slice(prefixLength + middleLength, prefixLength + middleLength + 4);
  return [prefix, middle, last].filter(Boolean).join("-");
}

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

export default function ScreenHQAccount() {
  const { theme, toggleTheme } = useTheme();
  const [changingPw, setChangingPw] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const me = useHqMe();
  const phone = me?.company.phone ?? "";
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [confirmingWithdrawal, setConfirmingWithdrawal] = useState(false);
  const [withdrawalPassword, setWithdrawalPassword] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const withdraw = async () => {
    if (withdrawing) return;
    if (!withdrawalPassword) {
      showToast("현재 비밀번호를 입력해 주세요.", "error");
      return;
    }
    setWithdrawing(true);
    try {
      await hqApi.withdraw({ currentPassword: withdrawalPassword });
      clearHqMeCache();
      markSignedOut("hq");
      showToast("회원 탈퇴가 처리됐어요.");
      navigate("/hq/login", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        showToast("현재 비밀번호가 올바르지 않아요.", "error");
        setWithdrawalPassword("");
      } else {
        showToast(errorMessage(err, "회원 탈퇴에 실패했어요."), "error");
      }
      setWithdrawing(false);
    }
  };

  return (
    <HQLayout>
      <HQContent maxWidth={695}>
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-1 leading-[1.45]">
            <h1 className="text-xl font-medium text-[var(--color-text-heading)]">계정 설정</h1>
            <p className="text-[13px] text-[var(--color-text-body)]">내 정보와 로그인 보안을 관리할 수 있어요.</p>
          </div>

          <Card title="기본 정보" description="본사 관리자 계정 정보예요.">
            <Row label="이름" value={me?.user.name ?? "-"} action={fixedNote} />
            <Row label="이메일" value={me?.user.email ?? "-"} action={<button type="button" onClick={() => setEditingEmail(true)} className={smallBtn}>변경</button>} />
            <Row
              label="연락처"
              value={phone || "등록된 연락처가 없어요"}
              action={
                <button type="button" onClick={() => setEditingPhone(true)} className={smallBtn}>
                  변경
                </button>
              }
            />
            <Row label="소속 본사" value={me?.company.companyName ?? "-"} sub="소속 변경은 운영팀에 요청해 주세요." action={fixedNote} />
          </Card>

          <Card title="화면 테마" description="원하는 화면 모드를 선택할 수 있어요.">
            <div className="flex items-center justify-between gap-4 border-t border-[var(--home-card-border)] px-5 py-3.5">
              <span className="text-[13px] text-[var(--color-text-body)]">화면 모드</span>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-[var(--color-text-label)]">{theme === "dark" ? "다크" : "라이트"}</span>
                <button
                  type="button"
                  role="switch"
                  aria-label="다크 모드"
                  aria-checked={theme === "dark"}
                  onClick={toggleTheme}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${theme === "dark" ? "border-[var(--color-accent)] bg-[var(--color-accent)]" : "border-[var(--home-card-border)] bg-[var(--color-bg-tile)]"}`}
                >
                  <span className={`flex size-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${theme === "dark" ? "translate-x-[22px]" : "translate-x-1"}`}>
                    {theme === "dark" ? (
                      <svg viewBox="0 0 24 24" className="size-3 text-slate-700" fill="currentColor" aria-hidden="true">
                        <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.6 8.6 0 1 0 20.2 15.4Z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="size-3 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="4" />
                        <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                      </svg>
                    )}
                  </span>
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
              value="계정에서 로그아웃할 수 있어요."
              action={
                <button
                  type="button"
                  onClick={() => setConfirmingLogout(true)}
                  className="rounded border border-[var(--color-danger-border)] bg-transparent px-3.5 py-1.5 text-[13px] text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-soft-bg)]"
                >
                  로그아웃
                </button>
              }
            />
          </Card>


          <Card
            title="회원 탈퇴"
            description="본사 계정이 비활성화되고 모든 로그인 세션이 종료됩니다. 회사·현장·작업자 데이터는 유지됩니다."
          >
            <div className="flex items-center justify-between gap-4 border-t border-[var(--home-card-border)] px-5 py-3.5">
              <span className="text-xs text-[var(--color-text-body)]">탈퇴하려면 현재 비밀번호를 확인해야 합니다.</span>
              <button
                type="button"
                onClick={() => setConfirmingWithdrawal(true)}
                className="shrink-0 rounded bg-[#dc2626] px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:brightness-90"
              >
                회원 탈퇴
              </button>
            </div>
          </Card>
        </div>
      </HQContent>

      {editingEmail && <EmailChangeModal currentEmail={me?.user.email ?? ""} onClose={() => setEditingEmail(false)} onSave={async (payload) => { const updated = await hqApi.updateEmail(payload); patchHqUser({ email: updated.email || payload.email }); showToast("이메일을 변경했어요.", "success"); }} />}
      {changingPw && <PasswordModal onClose={() => setChangingPw(false)} />}
      {editingPhone && <PhoneModal initial={phone} onClose={() => setEditingPhone(false)} />}
      {confirmingLogout && (
        <ConfirmDialog
          title="로그아웃할까요?"
          confirmLabel="로그아웃"
          onCancel={() => setConfirmingLogout(false)}
          onConfirm={async () => {
            setConfirmingLogout(false);
            try {
              await hqApi.logout();
            } catch {
              // 서버 세션이 이미 끝났어도 클라이언트 로그아웃을 마칩니다.
            }
            clearHqMeCache();
            markSignedOut("hq");
            showToast("로그아웃했어요.");
            navigate("/hq/login", { replace: true });
          }}
        />
      )}
      {confirmingWithdrawal && (
        <ConfirmDialog
          title="본사 계정을 탈퇴할까요?"
          description="현재 비밀번호를 확인하면 본사 계정이 비활성화되고 모든 로그인 세션이 종료됩니다. 회사·현장·작업자 데이터는 유지됩니다."
          confirmLabel={withdrawing ? "탈퇴 처리 중..." : "회원 탈퇴"}
          destructive
          busy={withdrawing}
          onCancel={() => {
            if (withdrawing) return;
            setConfirmingWithdrawal(false);
            setWithdrawalPassword("");
          }}
          onConfirm={() => void withdraw()}
        >
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-xs text-[var(--color-text-label)]">현재 비밀번호</span>
            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              value={withdrawalPassword}
              onChange={(event) => setWithdrawalPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void withdraw();
              }}
              placeholder="현재 비밀번호 입력"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2.5 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)]"
            />
          </label>
        </ConfirmDialog>
      )}
    </HQLayout>
  );
}

/** 본사 연락처 = 회사 대표 연락처(작업자 홈에 표시됨). 빈 값으로 저장하면 해제된다. */
function PhoneModal({ initial, onClose }: { initial: string; onClose: () => void }) {
  const { showToast } = useToast();
  const [value, setValue] = useState(formatPhoneNumber(initial));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    const v = value.trim();
    if (v && !PHONE_RE.test(v)) return setError("연락처 형식을 확인해 주세요. (예: 02-1234-5678)");
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await hqApi.updateProfile({ phone: v });
      patchHqCompany({ phone: res?.phone ?? (v || null) });
      showToast(v ? "연락처를 변경했어요." : "연락처를 해제했어요.", "success");
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
            setValue(formatPhoneNumber(e.target.value));
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="02-0000-0000"
          className={inputCls}
        />
        {error ? (
          <span className="text-[11px] leading-[1.45] text-[var(--color-danger-text)]">{error}</span>
        ) : (
          <span className="text-[11px] leading-[1.45] text-[var(--color-text-body)]">비워서 저장하면 연락처가 해제돼요.</span>
        )}
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
      await hqApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      showToast("비밀번호를 변경했어요.", "success");
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setErrors({ current: "현재 비밀번호가 올바르지 않아요." });
      } else {
        showToast(errorMessage(err, "비밀번호 변경에 실패했어요."), "error");
      }
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
