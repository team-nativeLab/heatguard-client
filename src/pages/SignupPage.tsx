import EmailVerification from "../components/auth/EmailVerification";
import { useEmailVerification } from "../hooks/useEmailVerification";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCardLayout from "../components/auth/AuthCardLayout";
import AuthField from "../components/auth/AuthField";
import AuthSubmitButton from "../components/auth/AuthSubmitButton";
import { AnimatedLockIcon, UserIcon, UsersIcon, MapPinIcon } from "../components/auth/AuthIcons";
import { useToast } from "../shared/ui/Toast";
import { authApi, ApiError, errorMessage } from "../api";
import { getPasswordConfirmationError, getPasswordError } from "../lib/passwordPolicy";
import { NewPasswordAuthField } from "../components/auth/NewPasswordField";
import { usePasswordComposition } from "../components/auth/usePasswordComposition";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED = "필수 항목입니다";

const FEATURES = [
  {
    icon: <UsersIcon />,
    tone: "blue" as const,
    title: "현장 관리자 계정",
    description: "이메일 인증 후 미소속 계정으로 가입해요",
  },
  {
    icon: <MapPinIcon />,
    tone: "orange" as const,
    title: "나중에 현장 연결",
    description: "본사 초대를 수락해 현장에 연결해요",
  },
];

interface Values {
  managerName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}
type Errors = Partial<Record<keyof Values, string>>;

function validate(v: Values): Errors {
  const errors: Errors = {};
  if (!v.managerName.trim()) errors.managerName = REQUIRED;
  if (!v.email.trim()) errors.email = REQUIRED;
  else if (!EMAIL_RE.test(v.email.trim())) errors.email = "이메일 형식을 확인해주세요";
  const passwordError = getPasswordError(v.password);
  const confirmationError = getPasswordConfirmationError(v.password, v.passwordConfirm);
  if (passwordError) errors.password = passwordError;
  if (confirmationError) errors.passwordConfirm = confirmationError;
  return errors;
}

const STEP1_KEYS: (keyof Values)[] = ["managerName"];
const PASSWORD_KEYS: (keyof Values)[] = ["password", "passwordConfirm"];

function pick(errors: Errors, keys: (keyof Values)[]): Errors {
  const out: Errors = {};
  for (const k of keys) if (errors[k]) out[k] = errors[k];
  return out;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [focusedPassword, setFocusedPassword] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const { showToast } = useToast();

  const [values, setValues] = useState<Values>({
    managerName: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const verification = useEmailVerification(values.email);
  const stepFields = useRef<HTMLDivElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current !== step) {
      stepFields.current?.querySelector("input")?.focus();
      previousStep.current = step;
    }
  }, [step]);
  const [codeError, setCodeError] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const passwordComposition = usePasswordComposition();

  const bind = (key: keyof Values) => ({
    value: values[key],
    error: errors[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }));
      if (key === "email") {
        verification.reset();
        setCodeError("");
      }
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || verification.sending || verification.verifying || passwordComposition.isComposing()) return;

    const all = validate(values);

    // 1단계: 기본 정보 검증 후 다음 단계로
    if (step === 1) {
      const step1Errors = pick(all, STEP1_KEYS);
      setErrors(step1Errors);
      if (Object.keys(step1Errors).length === 0) setStep(2);
      return;
    }

    if (step === 2) {
      const emailErrors = pick(all, ["email"]);
      setErrors(emailErrors);
      if (!Object.keys(emailErrors).length && verification.getToken()) setStep(3);
      return;
    }

    // 3단계: 비밀번호 검증 후 가입
    const step1Errors = pick(all, STEP1_KEYS);
    if (Object.keys(step1Errors).length > 0) {
      setErrors(step1Errors);
      setStep(1);
      return;
    }
    if (all.email) { setErrors({ email: all.email }); setStep(2); return; }
    const passwordErrors = pick(all, PASSWORD_KEYS);
    setErrors(passwordErrors);
    if (Object.keys(passwordErrors).length > 0) { setShakeKey((prev) => prev + 1); return; }

    const verificationToken = verification.getToken();
    if (!verificationToken) {
      setCodeError("이메일 인증이 만료됐어요. 다시 인증해주세요.");
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      await authApi.registerUnassigned({
        managerName: values.managerName.trim(),
        email: values.email.trim(),
        password: values.password,
        confirmPassword: values.passwordConfirm,
        verificationToken,
      });
      showToast("가입이 완료됐어요. 로그인해주세요.", "success");
      navigate("/auth/login", { state: { authFrom: "signup" } });
    } catch (err) {
      if (err instanceof ApiError && (err.code === "EMAIL_ALREADY_EXISTS" || (err.status === 409 && !err.code))) {
        setErrors({ email: "이미 가입된 이메일이에요" });
        setStep(2);
      } else if (err instanceof ApiError && (err.code === "INVALID_VERIFICATION_CODE" || err.code === "INVALID_VERIFICATION_TOKEN")) {
        verification.reset();
        setStep(2);
        setCodeError("인증코드가 올바르지 않거나 만료됐어요. 확인 후 다시 입력하거나 재발송해주세요.");
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
      titleLines={["이메일 인증 후", "현장 관리자 계정을 만드세요"]}
      descriptionLines={["먼저 미소속 계정을 만들고", "본사 초대를 받아 현장에 연결합니다."]}
      features={FEATURES}
      step={2}
      footerLabel="폭염가드 관리자 포털"
      cardTitle="관리자 회원가입"
      cardSubtitle={step === 1 ? "이름을 입력해 계정 가입을 시작합니다." : step === 2 ? "이메일 인증을 완료해주세요." : "로그인에 사용할 비밀번호를 설정해주세요."}
    >
      <form className="mt-[22px] flex flex-col" onSubmit={handleSubmit} noValidate>
        <p className="sr-only" role="status" aria-live="polite">{step === 1 ? "기본 정보 입력" : step === 2 ? "이메일 인증" : "비밀번호 설정"}</p>
        <div ref={stepFields} key={step} className="auth-fade-in flex min-h-[340px] flex-col">
          {step === 1 ? (
            <AuthField size="md" label="담당자 이름" icon={<UserIcon />} placeholder="홍길동" autoComplete="name" {...bind("managerName")} />
          ) : step === 2 ? (
            <>
              <EmailVerification email={values.email} onEmailChange={bind("email").onChange} emailError={errors.email} verification={verification} disabled={submitting} error={codeError} onEdit={() => setCodeError("")} />
            </>
          ) : (
            <>
              <NewPasswordAuthField
                size="md"
                label="비밀번호"
                icon={<AnimatedLockIcon key={`password-${shakeKey}`} open={focusedPassword === "password"} shake={!!errors.password} />}
                placeholder="8자 이상 입력하세요"
                revealable
                {...bind("password")}
                onFocus={() => setFocusedPassword("password")}
                onBlur={() => setFocusedPassword("")}
                {...passwordComposition.inputProps}
              />
              <NewPasswordAuthField
                size="md"
                label="비밀번호 확인"
                icon={<AnimatedLockIcon key={`confirm-${shakeKey}`} open={focusedPassword === "confirm"} shake={!!errors.passwordConfirm} />}
                placeholder="비밀번호를 한 번 더 입력하세요"
                revealable
                confirmation
                {...bind("passwordConfirm")}
                onFocus={() => setFocusedPassword("confirm")}
                onBlur={() => setFocusedPassword("")}
                {...passwordComposition.inputProps}
              />
            </>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {step > 1 && <button
            type="button"
            disabled={submitting || verification.sending || verification.verifying}
            onClick={() => { setErrors({}); setStep(step === 3 ? 2 : 1); }}
            className="h-12 w-[96px] shrink-0 rounded-xl border border-[var(--auth-input-border)] bg-[var(--auth-secondary-bg)] text-base font-medium text-[var(--auth-text-strong)] transition hover:border-[var(--auth-accent)]"
          >이전</button>}
          <AuthSubmitButton className="mt-0" disabled={submitting || verification.sending || verification.verifying || (step === 2 && !verification.verified)}>
            {submitting ? "가입 중..." : step === 3 ? "가입하기" : "다음"}
          </AuthSubmitButton>
        </div>
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
