import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCardLayout from "../components/auth/AuthCardLayout";
import AuthField from "../components/auth/AuthField";
import AuthSubmitButton from "../components/auth/AuthSubmitButton";
import { BuildingIcon, LockIcon, MailIcon, MapPinIcon, UserIcon, UsersIcon } from "../components/auth/AuthIcons";
import { useToast } from "../shared/ui/Toast";
import { authApi, ApiError, isDemoFallback, errorMessage } from "../api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const REQUIRED = "필수 항목입니다";

const FEATURES = [
  {
    icon: <UsersIcon />,
    tone: "blue" as const,
    title: "작업자 계정 추가",
    description: "현장 작업자를 팀에 초대하세요",
  },
  {
    icon: <MapPinIcon />,
    tone: "orange" as const,
    title: "소속 현장 관리",
    description: "현장별 기록과 알림을 관리하세요",
  },
];

interface Values {
  companyName: string;
  managerName: string;
  siteName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}
type Errors = Partial<Record<keyof Values, string>>;

function validate(v: Values): Errors {
  const errors: Errors = {};
  if (!v.companyName.trim()) errors.companyName = REQUIRED;
  if (!v.managerName.trim()) errors.managerName = REQUIRED;
  if (!v.siteName.trim()) errors.siteName = REQUIRED;
  if (!v.email.trim()) errors.email = REQUIRED;
  else if (!EMAIL_RE.test(v.email.trim())) errors.email = "이메일 형식을 확인해주세요";
  if (!v.password) errors.password = REQUIRED;
  else if (v.password.length < MIN_PASSWORD) errors.password = `${MIN_PASSWORD}자 이상 입력해주세요`;
  if (!v.passwordConfirm) errors.passwordConfirm = REQUIRED;
  else if (v.password && v.password !== v.passwordConfirm) errors.passwordConfirm = "비밀번호가 일치하지 않아요";
  return errors;
}

const STEP1_KEYS: (keyof Values)[] = ["companyName", "managerName", "siteName", "email"];
const STEP2_KEYS: (keyof Values)[] = ["password", "passwordConfirm"];

function pick(errors: Errors, keys: (keyof Values)[]): Errors {
  const out: Errors = {};
  for (const k of keys) if (errors[k]) out[k] = errors[k];
  return out;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const { showToast } = useToast();

  const [values, setValues] = useState<Values>({
    companyName: "",
    managerName: "",
    siteName: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const bind = (key: keyof Values) => ({
    value: values[key],
    error: errors[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const all = validate(values);

    // 1단계: 기본 정보 검증 후 다음 단계로
    if (step === 1) {
      const step1Errors = pick(all, STEP1_KEYS);
      setErrors(step1Errors);
      if (Object.keys(step1Errors).length === 0) setStep(2);
      return;
    }

    // 2단계: 비밀번호 검증 후 가입
    const step1Errors = pick(all, STEP1_KEYS);
    if (Object.keys(step1Errors).length > 0) {
      setErrors(step1Errors);
      setStep(1);
      return;
    }
    const step2Errors = pick(all, STEP2_KEYS);
    setErrors(step2Errors);
    if (Object.keys(step2Errors).length > 0) return;

    setSubmitting(true);
    try {
      await authApi.register({
        companyName: values.companyName.trim(),
        managerName: values.managerName.trim(),
        siteName: values.siteName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      showToast("가입이 완료됐어요. 로그인해주세요.", "success");
      navigate("/auth/login", { state: { authFrom: "signup" } });
    } catch (err) {
      if (isDemoFallback(err)) {
        showToast("서버 연결 없이 데모 모드로 진행할게요.", "default");
        navigate("/auth/login", { state: { authFrom: "signup" } });
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: "이미 가입된 이메일이에요" });
        setStep(1);
      } else {
        showToast(errorMessage(err, "회원가입에 실패했어요."), "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      side="signup"
      eyebrow="관리자 회원가입"
      titleLines={["가입 즉시", "현장 관리자가 됩니다"]}
      descriptionLines={["현장관리자 계정 생성 후, 작업자 계정을 추가하고", "소속 현장을 관리할 수 있습니다."]}
      features={FEATURES}
      step={2}
      footerLabel="폭염가드 관리자 포털"
      cardTitle="관리자 회원가입"
      cardSubtitle={step === 1 ? "가입 시 관리자 계정이 생성됩니다." : "로그인에 사용할 비밀번호를 설정해주세요."}
    >
      <form className="mt-[22px] flex flex-col" onSubmit={handleSubmit} noValidate>

        <div key={step} className="auth-fade-in flex min-h-[340px] flex-col">
          {step === 1 ? (
            <>
              <AuthField size="md" label="회사 이름" icon={<BuildingIcon />} placeholder="탑세이프티컨설팅" autoComplete="organization" {...bind("companyName")} />
              <AuthField size="md" label="담당자 이름" icon={<UserIcon />} placeholder="홍길동" autoComplete="name" {...bind("managerName")} />
              <AuthField size="md" label="현장 이름" icon={<MapPinIcon size={18} />} placeholder="울산 석유화학 플랜트 증설" {...bind("siteName")} />
              <AuthField size="md" label="이메일" type="email" icon={<MailIcon />} placeholder="manager@example.com" autoComplete="username" {...bind("email")} />
            </>
          ) : (
            <>
              <AuthField size="md" label="비밀번호" type="password" icon={<LockIcon />} placeholder="8자 이상 입력하세요" autoComplete="new-password" revealable {...bind("password")} />
              <AuthField size="md" label="비밀번호 확인" type="password" icon={<LockIcon />} placeholder="비밀번호를 한 번 더 입력하세요" autoComplete="new-password" revealable {...bind("passwordConfirm")} />
            </>
          )}
        </div>

        {step === 1 ? (
          <AuthSubmitButton className="mt-6">다음</AuthSubmitButton>
        ) : (
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setStep(1);
              }}
              className="h-12 w-[96px] shrink-0 rounded-xl border border-[var(--auth-input-border)] bg-[var(--auth-secondary-bg)] text-base font-medium text-[var(--auth-text-strong)] transition hover:border-[var(--auth-accent)]"
            >
              이전
            </button>
            <AuthSubmitButton disabled={submitting}>{submitting ? "가입 중..." : "가입하기"}</AuthSubmitButton>
          </div>
        )}
      </form>

      <p className="mt-[18px] flex justify-center gap-3 text-sm leading-[1.4]">
        <span className="text-[var(--auth-text-muted)]">이미 계정이 있으신가요?</span>
        <Link to="/auth/login" state={{ authFrom: "signup" }} className="font-bold text-[var(--auth-accent)] hover:underline">
          로그인
        </Link>
      </p>
    </AuthCardLayout>
  );
}
