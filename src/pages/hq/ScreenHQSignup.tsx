import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCardLayout from "../../components/auth/AuthCardLayout";
import AuthField from "../../components/auth/AuthField";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import { hqApi, ApiError, errorMessage } from "../../api";
import { useToast } from "../../shared/ui/Toast";
import { BuildingIcon, LockIcon, MailIcon, MapPinIcon, UserIcon, UsersIcon } from "../../components/auth/AuthIcons";

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
  if (!v.password) errors.password = REQUIRED;
  else if (v.password.length < 8) errors.password = "8자 이상 입력해주세요";
  if (!v.confirm) errors.confirm = REQUIRED;
  else if (v.password && v.confirm !== v.password) errors.confirm = "비밀번호가 일치하지 않아요";
  return errors;
}

const STEP1_KEYS: (keyof Values)[] = ["company", "manager", "email"];
const STEP2_KEYS: (keyof Values)[] = ["password", "confirm"];
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
  const [values, setValues] = useState<Values>(EMPTY);
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<Errors>(() => (validation ? pick(validate(EMPTY), STEP1_KEYS) : {}));

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const all = validate(values);
    const step1Errors = pick(all, STEP1_KEYS);

    // 1단계: 기본 정보 검증 후 다음 단계로
    if (step === 1) {
      setErrors(step1Errors);
      if (Object.keys(step1Errors).length === 0) setStep(2);
      return;
    }

    // 2단계: 비밀번호 검증 후 가입
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
      await hqApi.register({
        companyName: values.company.trim(),
        managerName: values.manager.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      showToast("가입이 완료됐어요. 로그인해주세요.", "success");
      navigate("/hq/login", { state: { authFrom: "signup" } });
    } catch (err) {
      if (err instanceof ApiError && err.code === "SILO_ALREADY_BOOTSTRAPPED") {
        setErrors({ company: "이미 본사 계정이 등록된 회사예요" });
        setStep(1);
      } else if (err instanceof ApiError && (err.code === "EMAIL_ALREADY_EXISTS" || (err.status === 409 && !err.code))) {
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
      eyebrow="본사 회원가입"
      titleLines={["가입 즉시", "현장 관리가 시작됩니다"]}
      descriptionLines={["본사 계정 생성 후, 현장관리자 계정을 추가하고", "소속 현장을 등록할 수 있습니다."]}
      features={FEATURES}
      step={2}
      cardTitle="본사 회원가입"
      cardSubtitle={step === 1 ? "가입 시 회사와 본사 계정이 함께 생성됩니다." : "로그인에 사용할 비밀번호를 설정해주세요."}
    >
      <form className="mt-[22px] flex flex-col" onSubmit={handleSubmit} noValidate>
        <div key={step} className="auth-fade-in flex min-h-[340px] flex-col">
          {step === 1 ? (
            <>
              <AuthField size="md" label="본사(회사) 이름" icon={<BuildingIcon />} placeholder="탑세이프티컨설팅" autoComplete="organization" value={values.company} onChange={set("company")} error={errors.company} />
              <AuthField size="md" label="담당자 이름" icon={<UserIcon />} placeholder="홍길동" autoComplete="name" value={values.manager} onChange={set("manager")} error={errors.manager} />
              <AuthField size="md" label="이메일" type="email" icon={<MailIcon />} placeholder="hq@example.com" autoComplete="username" value={values.email} onChange={set("email")} error={errors.email} />
            </>
          ) : (
            <>
              <AuthField size="md" label="비밀번호" type="password" icon={<LockIcon />} placeholder="8자 이상 입력하세요" autoComplete="new-password" revealable value={values.password} onChange={set("password")} error={errors.password} />
              <AuthField size="md" label="비밀번호 확인" type="password" icon={<LockIcon />} placeholder="비밀번호를 한 번 더 입력하세요" autoComplete="new-password" revealable value={values.confirm} onChange={set("confirm")} error={errors.confirm} />
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
            <AuthSubmitButton className="mt-0" disabled={submitting}>{submitting ? "가입 중..." : "가입하기"}</AuthSubmitButton>
          </div>
        )}
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
