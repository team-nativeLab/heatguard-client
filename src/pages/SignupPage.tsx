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
    description: "팀마다 작업자를 지정하세요",
  },
  {
    icon: <MapPinIcon />,
    tone: "orange" as const,
    title: "소속 현장 관리",
    description: "현장 정보와 팀을 관리하세요",
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

export default function SignupPage() {
  const navigate = useNavigate();
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

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
      navigate("/auth/login");
    } catch (err) {
      if (isDemoFallback(err)) {
        showToast("서버 연결 없이 데모 모드로 진행할게요.", "default");
        navigate("/auth/login");
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: "이미 가입된 이메일이에요" });
      } else {
        showToast(errorMessage(err, "회원가입에 실패했어요."), "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      eyebrow="현장관리자 회원가입"
      titleLines={["가입 즉시", "현장 관리가 시작됩니다"]}
      descriptionLines={["현장관리자 계정 생성 후, 작업자 계정을 추가하고", "소속 현장을 관리할 수 있습니다."]}
      features={FEATURES}
      step={2}
      footerLabel="폭염가드 현장관리자 포털"
      cardTitle="현장관리자 회원가입"
      cardSubtitle="가입 시 관리자 계정이 생성됩니다."
    >
      <form className="mt-[22px] flex flex-col" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-3">
          <AuthField size="md" label="회사 이름" icon={<BuildingIcon />} placeholder="탑세이프티컨설팅" autoComplete="organization" {...bind("companyName")} />
          <AuthField size="md" label="담당자 이름" icon={<UserIcon />} placeholder="홍길동" autoComplete="name" {...bind("managerName")} />
          <AuthField size="md" label="현장 이름" icon={<MapPinIcon size={18} />} placeholder="울산 석유화학 플랜트 증설" {...bind("siteName")} />
          <AuthField size="md" label="이메일" type="email" icon={<MailIcon />} placeholder="manager@example.com" autoComplete="username" {...bind("email")} />
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
            <AuthField size="md" label="비밀번호" type="password" icon={<LockIcon />} placeholder="8자 이상" autoComplete="new-password" {...bind("password")} />
            <AuthField size="md" label="비밀번호 확인" type="password" icon={<LockIcon />} placeholder="한 번 더 입력" autoComplete="new-password" {...bind("passwordConfirm")} />
          </div>
        </div>

        <AuthSubmitButton className="mt-6" disabled={submitting}>
          {submitting ? "가입 중..." : "가입하기"}
        </AuthSubmitButton>
      </form>

      <p className="mt-[18px] flex justify-center gap-3 text-sm leading-[1.4]">
        <span className="text-[var(--auth-text-muted)]">이미 계정이 있으신가요?</span>
        <Link to="/auth/login" className="font-bold text-[var(--auth-accent)] hover:underline">
          로그인
        </Link>
      </p>
    </AuthCardLayout>
  );
}
