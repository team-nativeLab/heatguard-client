import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCardLayout from "../components/auth/AuthCardLayout";
import AuthField from "../components/auth/AuthField";
import AuthSubmitButton from "../components/auth/AuthSubmitButton";
import { BarChartIcon, FileTextIcon, LockIcon, MailIcon } from "../components/auth/AuthIcons";
import { useToast } from "../shared/ui/Toast";
import { markSignedIn } from "../shared/auth/RequireAuth";
import { clearSiteMeCache } from "../hooks/useSiteMe";
import { authApi, ApiError, isDemoFallback, errorMessage } from "../api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES = [
  {
    icon: <BarChartIcon />,
    tone: "blue" as const,
    title: "소속 현장 위험도 대시보드",
    description: "실시간 위험도와 현황을 한눈에",
  },
  {
    icon: <FileTextIcon />,
    tone: "orange" as const,
    title: "전체 기록 통합 피드",
    description: "현장별 기록과 알림을 통합 관리",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // 로그인 가드가 보낸 경우 원래 보던 화면으로 돌아간다.
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/manager";
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const enter = () => navigate(redirectTo, { replace: true });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
      await authApi.login({ email: email.trim(), password });
      clearSiteMeCache();
      markSignedIn();
      enter();
    } catch (err) {
      if (isDemoFallback(err)) {
        showToast("서버 연결 없이 데모 모드로 진행할게요.");
        enter();
        return;
      }
      if (err instanceof ApiError && err.status === 401) {
        setPasswordError("비밀번호가 올바르지 않아요");
      } else {
        showToast(errorMessage(err, "로그인에 실패했어요."), "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      eyebrow="관리자 포털"
      titleLines={["여러 팀을", "한눈에 관리하세요"]}
      descriptionLines={["소속 현장 전체의 폭염 상황 · 기록 · 긴급호출을", "실시간으로 관리합니다."]}
      features={FEATURES}
      step={1}
      footerLabel="폭염가드 관리자 포털"
      cardTitle="폭염가드"
      cardSubtitle="관리자 계정으로 로그인해주세요."
    >
      <form className="mt-9 flex flex-col gap-0.5" onSubmit={handleSubmit} noValidate>
        <AuthField
          label="이메일"
          type="email"
          icon={<MailIcon />}
          placeholder="이메일 주소를 입력하세요"
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
          icon={<LockIcon />}
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

      <p className="mt-4 flex justify-center gap-3 text-sm leading-[1.4]">
        <span className="text-[var(--auth-text-muted)]">관리자 계정이 없으신가요?</span>
        <Link to="/auth/signup" state={{ authFrom: "login" }} className="font-bold text-[var(--auth-accent)] hover:underline">
          회원가입
        </Link>
      </p>
    </AuthCardLayout>
  );
}
