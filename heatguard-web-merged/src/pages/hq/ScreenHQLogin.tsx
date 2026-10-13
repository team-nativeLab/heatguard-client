import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCardLayout from "../../components/auth/AuthCardLayout";
import AuthField from "../../components/auth/AuthField";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import { BarChartIcon, FileTextIcon, AnimatedLockIcon, MailIcon, UsersIcon } from "../../components/auth/AuthIcons";
import { hqApi, ApiError, errorMessage } from "../../api";
import { clearHqMeCache } from "../../hooks/useHqMe";
import { markSignedIn } from "../../shared/auth/RequireAuth";
import { useToast } from "../../shared/ui/Toast";

const FEATURES = [
  {
    icon: <BarChartIcon size={24} />,
    tone: "blue",
    title: "소속 현장 위험도 순 대시보드",
    description: "위험도가 높은 현장부터 한눈에",
  },
  {
    icon: <UsersIcon size={24} />,
    tone: "orange",
    title: "현장관리자 계정 생성 및 관리",
    description: "현장별 관리자 계정을 손쉽게",
  },
  {
    icon: <FileTextIcon size={24} />,
    tone: "blue",
    title: "전체 기록 통합 피드",
    description: "현장별 기록과 알림을 통합 관리",
  },
] as const;

export default function ScreenHQLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  // 비밀번호 칸에 포커스하고 입력 전이면 열려 있고, 입력을 시작하면 잠긴다. 로그인 성공 시 열린 뒤 이동.
  const lockOpen = unlocked || (pwFocused && !password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const nextEmailError = email.trim() ? "" : "이메일을 입력해주세요";
    const nextPasswordError = password ? "" : "비밀번호를 입력해주세요";
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    setSubmitting(true);
    try {
      await hqApi.login({ email: email.trim(), password });
      clearHqMeCache();
      markSignedIn("hq");
      // 성공: 자물쇠가 열리는 모습을 잠깐 보여준 뒤 이동한다.
      setUnlocked(true);
      await new Promise((r) => setTimeout(r, 650));
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith("/hq") ? from : "/hq/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setPasswordError("이메일 또는 비밀번호가 올바르지 않아요");
        setShakeKey((k) => k + 1);
      } else if (err instanceof ApiError && err.status === 403) {
        showToast("비활성화된 계정이에요. 관리자에게 문의해주세요.", "error");
      } else if (err instanceof ApiError && err.status === 429) {
        showToast("로그인 시도가 너무 많아요. 잠시 후 다시 시도해주세요.", "error");
      } else {
        showToast(errorMessage(err, "로그인에 실패했어요."), "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      eyebrow="본사 포털"
      titleLines={["여러 현장을", "한눈에 관리하세요"]}
      descriptionLines={["소속 현장 전체의 폭염 상황 · 기록 · 긴급호출을", "실시간으로 모니터링합니다."]}
      features={FEATURES.map((f) => ({ ...f }))}
      step={2}
      cardTitle="폭염가드"
      cardSubtitle="본사 계정으로 로그인해주세요."
    >
      <form className="mt-14 flex flex-col gap-1" onSubmit={handleSubmit} noValidate>
        <AuthField
          label="이메일"
          type="email"
          icon={<MailIcon />}
          placeholder="이메일 주소를 입력하세요"
          autoComplete="username"
          value={email}
          error={emailError}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError("");
          }}
        />
        <AuthField
          label="비밀번호"
          type="password"
          icon={<AnimatedLockIcon key={shakeKey} open={lockOpen} shake={shakeKey > 0 && !!passwordError} />}
          value={password}
          error={passwordError}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError("");
          }}
          onFocus={() => setPwFocused(true)}
          onBlur={() => setPwFocused(false)}
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
          revealable
        />
        <AuthSubmitButton disabled={submitting}>{submitting ? "로그인 중..." : "로그인"}</AuthSubmitButton>
      </form>

      <p className="mt-6 flex justify-center gap-3 text-sm leading-[1.4]">
        <span className="text-[var(--auth-text-muted)]">본사 계정이 없으신가요?</span>
        <Link to="/hq/signup" state={{ authFrom: "login" }} className="font-bold text-[var(--auth-accent)] hover:underline">
          회원가입
        </Link>
      </p>
    </AuthCardLayout>
  );
}
