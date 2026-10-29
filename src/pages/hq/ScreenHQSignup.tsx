import EmailVerification from "../../components/auth/EmailVerification";
import { useEmailVerification } from "../../hooks/useEmailVerification";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCardLayout from "../../components/auth/AuthCardLayout";
import AuthField from "../../components/auth/AuthField";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import { hqApi, ApiError, errorMessage } from "../../api";
import { useToast } from "../../shared/ui/Toast";
import { AnimatedLockIcon, BuildingIcon, MailIcon, MapPinIcon, UserIcon, UsersIcon } from "../../components/auth/AuthIcons";
import { getPasswordConfirmationError, getPasswordError } from "../../lib/passwordPolicy";
import { NewPasswordAuthField } from "../../components/auth/NewPasswordField";
import { usePasswordComposition } from "../../components/auth/usePasswordComposition";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED = "필수 항목입니다";

const FEATURES = [
  {
    icon: <UsersIcon size={24} />,
    tone: "blue" as const,
    title: "현장관리자 계정 추가",
    description: "현장마다 관리자를 지정하세요",
  },
  {
    icon: <MapPinIcon size={24} />,
    tone: "orange" as const,
    title: "소속 현장 등록",
    description: "현장 위치와 정보를 등록하세요",
  },
];

interface Values {
  company: string;
  manager: string;
  email: string;
  password: string;
  confirm: string;
}

function validate(v: Values): Partial<Record<keyof Values, string>> {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (!v.company.trim()) errors.company = REQUIRED;
  if (!v.manager.trim()) errors.manager = REQUIRED;
  if (!v.email.trim()) errors.email = REQUIRED;
  else if (!EMAIL_RE.test(v.email.trim())) errors.email = "이메일 형식을 확인해주세요";
  const passwordError = getPasswordError(v.password);
  const confirmationError = getPasswordConfirmationError(v.password, v.confirm);
  if (passwordError) errors.password = passwordError;
  if (confirmationError) errors.confirm = confirmationError;
  return errors;
}

const STEP1_KEYS: (keyof Values)[] = ["company", "manager"];
const PASSWORD_KEYS: (keyof Values)[] = ["password", "confirm"];
type Errors = Partial<Record<keyof Values, string>>;

function pick(errors: Errors, keys: (keyof Values)[]): Errors {
  const out: Errors = {};
  for (const k of keys) if (errors[k]) out[k] = errors[k];
  return out;
}

const EMPTY: Values = { company: "", manager: "", email: "", password: "", confirm: "" };

/** validation=true 이면 빈 상태로 제출한 직후(Figma 03_회원가입_입력검증) 화면으로 시작한다. */
export default function ScreenHQSignup({ validation = false }: { validation?: boolean }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const passwordComposition = usePasswordComposition();
  const [values, setValues] = useState<Values>(EMPTY);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [focusedPassword, setFocusedPassword] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
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
  const [errors, setErrors] = useState<Errors>(() => (validation ? pick(validate(EMPTY), STEP1_KEYS) : {}));

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    if (key === "email") {
      verification.reset();
      setCodeError("");
    }
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || verification.sending || verification.verifying || passwordComposition.isComposing()) return;
    const all = validate(values);
    const step1Errors = pick(all, STEP1_KEYS);

    // 1단계: 기본 정보 검증 후 다음 단계로
    if (step === 1) {
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
      await hqApi.register({
        companyName: values.company.trim(),
        managerName: values.manager.trim(),
        email: values.email.trim(),
        password: values.password,
        confirmPassword: values.confirm,
        verificationToken,
      });
      showToast("가입이 완료됐어요. 로그인해주세요.", "success");
      navigate("/hq/login", { state: { authFrom: "signup" } });
    } catch (err) {
      if (err instanceof ApiError && err.code === "SILO_ALREADY_BOOTSTRAPPED") {
        setErrors({ company: "이미 본사 계정이 등록된 회사예요" });
        setStep(1);
      } else if (err instanceof ApiError && (err.code === "EMAIL_ALREADY_EXISTS" || (err.status === 409 && !err.code))) {
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
      eyebrow="본사 회원가입"
      titleLines={["가입 즉시", "현장 관리가 시작됩니다"]}
      descriptionLines={["본사 계정 생성 후, 현장관리자 계정을 추가하고", "소속 현장을 등록할 수 있습니다."]}
      features={FEATURES}
      step={2}
      cardTitle="본사 회원가입"
      cardSubtitle={step === 1 ? "가입 시 회사와 본사 계정이 함께 생성됩니다." : step === 2 ? "이메일 인증을 완료해주세요." : "로그인에 사용할 비밀번호를 설정해주세요."}
    >
      <form className="mt-[22px] flex flex-col" onSubmit={handleSubmit} noValidate>
        <p className="sr-only" role="status" aria-live="polite">{step === 1 ? "기본 정보 입력" : step === 2 ? "이메일 인증" : "비밀번호 설정"}</p>
        <div ref={stepFields} key={step} className="auth-fade-in flex min-h-[340px] flex-col">
          {step === 1 ? (
            <>
              <AuthField size="md" label="본사(회사) 이름" icon={<BuildingIcon />} placeholder="탑세이프티컨설팅" autoComplete="organization" value={values.company} onChange={set("company")} error={errors.company} />
              <AuthField size="md" label="담당자 이름" icon={<UserIcon />} placeholder="홍길동" autoComplete="name" value={values.manager} onChange={set("manager")} error={errors.manager} />
            </>
          ) : step === 2 ? (
            <>
              <AuthField size="md" label="이메일" type="email" icon={<MailIcon />} placeholder="hq@example.com" autoComplete="username" value={values.email} onChange={set("email")} error={errors.email} />
              <EmailVerification email={values.email} verification={verification} disabled={submitting} error={codeError} onEdit={() => setCodeError("")} />
            </>
          ) : (
            <>
              <NewPasswordAuthField
                size="md"
                label="비밀번호"
                icon={<AnimatedLockIcon key={`password-${shakeKey}`} open={focusedPassword === "password"} shake={!!errors.password} />}
                placeholder="8자 이상 입력하세요"
                revealable
                value={values.password}
                onChange={set("password")}
                error={errors.password}
                onFocus={() => setFocusedPassword("password")}
                onBlur={() => setFocusedPassword("")}
                {...passwordComposition.inputProps}
              />
              <NewPasswordAuthField
                size="md"
                label="비밀번호 확인"
                icon={<AnimatedLockIcon key={`confirm-${shakeKey}`} open={focusedPassword === "confirm"} shake={!!errors.confirm} />}
                placeholder="비밀번호를 한 번 더 입력하세요"
                revealable
                confirmation
                value={values.confirm}
                onChange={set("confirm")}
                error={errors.confirm}
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
        <Link to="/hq/login" state={{ authFrom: "signup" }} className="font-bold text-[var(--auth-accent)] hover:underline">
          로그인
        </Link>
      </p>
    </AuthCardLayout>
  );
}
