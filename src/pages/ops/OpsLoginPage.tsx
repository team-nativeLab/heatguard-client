import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthCardLayout from "../../components/auth/AuthCardLayout";
import AuthField from "../../components/auth/AuthField";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import { AnimatedLockIcon, FileTextIcon, MailIcon } from "../../components/auth/AuthIcons";
import { useToast } from "../../shared/ui/toastContext";
import { markSignedIn } from "../../shared/auth/authScope";
import { ApiError, errorMessage, opsApi } from "../../api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES = [
  {
    icon: <FileTextIcon />,
    tone: "blue" as const,
    title: "민원 처리",
    description: "회사에서 보낸 문의에 답변해요",
  },
];

/** 운영자 전용 로그인. 통합 관리자 로그인은 운영자 계정을 받지 않는다. */
export default function OpsLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const from = (location.state as { from?: string } | null)?.from;
  const redirectTo = from?.startsWith("/ops/") && from !== "/ops/login" ? from : "/ops/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const nextEmailError = !email.trim()
      ? "이메일을 입력해주세요"
      : !EMAIL_RE.test(email.trim())
        ? "이메일 형식을 확인해주세요"
        : "";
    const nextPasswordError = !password ? "비밀번호를 입력해주세요" : "";
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    setSubmitting(true);
    try {
      await opsApi.login({ email: email.trim(), password });
      markSignedIn("ops");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setPasswordError("이메일 또는 비밀번호가 올바르지 않아요");
        setShakeKey((k) => k + 1);
      } else if (err instanceof ApiError && err.code === "ACCOUNT_DISABLED") {
        // 403은 출처 거부(ORIGIN_NOT_ALLOWED) 등 다른 이유로도 오므로 코드로 구분한다.
        setPasswordError("비활성화된 운영자 계정이에요");
      } else {
        showToast(errorMessage(err, "로그인에 실패했어요."), "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      eyebrow="운영자 콘솔"
      titleLines={["폭염가드", "운영자 콘솔"]}
      descriptionLines={["회사에서 보낸 문의를 확인하고", "답변합니다."]}
      features={FEATURES}
      step={2}
      footerLabel="폭염가드 운영자 콘솔"
      cardTitle="폭염가드 관리자"
      cardSubtitle="운영자 계정으로 로그인해주세요."
      hideBackButton
    >
      <form className="mt-14 flex flex-col gap-1" onSubmit={handleSubmit} noValidate>
        <AuthField
          label="이메일"
          type="email"
          icon={<MailIcon />}
          placeholder="운영자 이메일을 입력하세요"
          autoComplete="username"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError("");
          }}
          error={emailError}
        />
        <AuthField
          label="비밀번호"
          type="password"
          icon={<AnimatedLockIcon key={shakeKey} open={false} shake={shakeKey > 0 && !!passwordError} />}
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
          revealable
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError("");
          }}
          error={passwordError}
        />
        <AuthSubmitButton disabled={submitting}>{submitting ? "로그인 중..." : "로그인"}</AuthSubmitButton>
      </form>
    </AuthCardLayout>
  );
}
