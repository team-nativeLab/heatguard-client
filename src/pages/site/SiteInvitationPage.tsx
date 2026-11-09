import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthCardLayout from "../../components/auth/AuthCardLayout";
import AuthField from "../../components/auth/AuthField";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import { AnimatedLockIcon, MailIcon } from "../../components/auth/AuthIcons";
import { NewPasswordAuthField } from "../../components/auth/NewPasswordField";
import { usePasswordComposition } from "../../components/auth/usePasswordComposition";
import { ApiError, authApi, errorMessage } from "../../api";
import { getPasswordConfirmationError, getPasswordError, SIGNUP_PASSWORD_MIN_LENGTH, SIGNUP_PASSWORD_POLICY_HINT } from "../../lib/passwordPolicy";
import { clearSelectedSiteId } from "../../lib/siteSelection";
import { clearSiteMeCache } from "../../hooks/useSiteMe";
import { markSignedIn } from "../../shared/auth/RequireAuth";
import { useToast } from "../../shared/ui/Toast";

const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

export default function SiteInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const invitationId = searchParams.get("invitationId")?.trim() ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const composition = usePasswordComposition();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (accepting || composition.isComposing()) return;
    if (!invitationId) return setError("초대 링크가 올바르지 않아요. 본사 관리자에게 새 링크를 요청해주세요.");
    if (!EMAIL_RE.test(email.trim())) { setError("이메일 주소를 확인해주세요."); return; }
    const passwordError = getPasswordError(password, SIGNUP_PASSWORD_MIN_LENGTH) || getPasswordConfirmationError(password, confirmPassword);
    if (passwordError) return setError(passwordError);
    setAccepting(true);
    setError("");
    try {
      // An invitation must only connect an already-created, unassigned manager account.
      // Authenticate first so the accept endpoint cannot create an account as a side effect.
      await authApi.login({ email: email.trim(), password });
      await authApi.acceptSiteInvitation({ invitationId, email: email.trim(), password, confirmPassword });
      setAccepted(true);
      clearSiteMeCache();
      authApi.clearManagedSitesCache();
      clearSelectedSiteId();
      markSignedIn();
      showToast("현장 연결과 로그인이 완료됐어요.", "success");
      navigate("/manager", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("계정이 없거나 이메일 또는 비밀번호가 맞지 않아요. 먼저 현장관리자 회원가입을 완료한 뒤 이 초대 화면으로 돌아와주세요.");
      } else if (err instanceof ApiError && err.status === 404) {
        setError("초대가 만료되었거나 이미 사용됐어요. 본사 관리자에게 새 링크를 요청해주세요.");
      } else if (err instanceof ApiError && err.status === 409 && err.code === "EMAIL_ALREADY_EXISTS") {
        setError("이 이메일 계정을 현장 관리자 계정으로 연결할 수 없어요. 본사 관리자에게 확인해주세요.");
      } else if (err instanceof ApiError && err.status === 409) {
        setError("이 현장에 관리자가 이미 연결됐어요. 본사 관리자에게 확인해주세요.");
      } else {
        setError(errorMessage(err, "초대를 수락하지 못했어요."));
      }
    } finally {
      setAccepting(false);
    }
  };

  const invalidLink = !invitationId;

  return (
    <AuthCardLayout
      side="signup"
      eyebrow="현장 관리자 초대"
      titleLines={["초대받은 현장에", "연결합니다"]}
      descriptionLines={["가입한 계정의 이메일과 비밀번호로", "초대를 수락해 현장에 연결합니다."]}
      features={[]}
      step={2}
      footerLabel="폭염가드 관리자 포털"
      cardTitle="현장 초대 수락"
      cardSubtitle="회원가입한 현장 관리자 계정으로 로그인한 뒤 연결해주세요."
    >
      {accepted ? (
        <div className="mt-8 rounded-xl border border-[var(--auth-input-border)] bg-[var(--auth-secondary-bg)] p-5 text-sm leading-6 text-[var(--auth-text-muted)]">
          <p className="font-semibold text-[var(--auth-text-strong)]">초대를 수락했어요.</p>
          <p className="mt-2">현장 관리자 로그인에서 방금 연결한 이메일과 비밀번호를 사용해주세요.</p>
          <Link to="/auth/login" state={{ email: email.trim() }} className="mt-4 inline-flex font-semibold text-[var(--auth-accent)] hover:underline">로그인</Link>
        </div>
      ) : invalidLink ? (
        <div role="alert" className="mt-8 rounded-xl border border-[var(--auth-input-border)] bg-[var(--auth-secondary-bg)] p-5 text-sm leading-6 text-[var(--auth-text-muted)]">
          초대 ID가 링크에 없어요. 본사 관리자에게 초대 링크를 다시 요청해주세요.
        </div>
      ) : (
        <>
        <p className="mt-6 text-xs leading-5 text-[var(--auth-text-muted)]">먼저 미소속 현장 관리자 계정을 회원가입하세요. 가입한 이메일과 비밀번호로 로그인한 뒤 초대를 수락하면 현장에 연결됩니다.</p>
        <p className="mt-2 text-xs text-[var(--auth-text-muted)]">계정이 없으신가요? <a href="/auth/signup" target="_blank" rel="noreferrer" className="font-semibold text-[var(--auth-accent)] hover:underline">먼저 회원가입</a></p>
        <form className="mt-3 flex flex-col gap-1" onSubmit={submit} noValidate>
          <AuthField label="계정 이메일" type="email" icon={<MailIcon />} placeholder="manager@example.com" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} />
          <NewPasswordAuthField
            label="현재 비밀번호"
            icon={<AnimatedLockIcon open={!!password} />}
            placeholder="가입할 때 설정한 비밀번호"
            minimumLength={SIGNUP_PASSWORD_MIN_LENGTH}
            policyHint={SIGNUP_PASSWORD_POLICY_HINT}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            {...composition.inputProps}
          />
          <NewPasswordAuthField
            label="비밀번호 확인"
            icon={<AnimatedLockIcon open={!!confirmPassword} />}
            placeholder="비밀번호를 한 번 더 입력하세요"
            value={confirmPassword}
            confirmation
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            {...composition.inputProps}
          />
          {error ? <p role="alert" className="mb-2 text-sm text-[var(--color-danger-text)]">{error}</p> : null}
          <AuthSubmitButton disabled={accepting}>{accepting ? "계정 확인 및 연결 중..." : "로그인 후 초대 수락"}</AuthSubmitButton>
        </form>
        </>
      )}
    </AuthCardLayout>
  );
}
