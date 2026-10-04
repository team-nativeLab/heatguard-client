import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import { useToast } from "../shared/ui/Toast";
import { authApi, ApiError, isDemoFallback, errorMessage } from "../api";

export default function SignupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [companyName, setCompanyName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!companyName.trim() || !managerName.trim() || !siteName.trim() || !email.trim()) {
      showToast("모든 항목을 입력해주세요.", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast("이메일 형식을 확인해주세요.", "error");
      return;
    }
    if (password.length < 4) {
      showToast("비밀번호는 4자 이상이어야 해요.", "error");
      return;
    }
    if (password !== passwordConfirm) {
      showToast("비밀번호가 일치하지 않아요.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.register({
        companyName: companyName.trim(),
        managerName: managerName.trim(),
        siteName: siteName.trim(),
        email: email.trim(),
        password,
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
        showToast("이미 가입된 이메일이에요.", "error");
      } else {
        showToast(errorMessage(err, "회원가입에 실패했어요."), "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout
      eyebrow="관리자 회원가입"
      titleLines={["가입 즉시", "현장 관리자가 됩니다"]}
      titleClassName="text-[24px] leading-[33px]"
      description="현장관리자 계정 생성 후, 작업자 계정을 추가하고 소속 현장을 관리할 수 있습니다."
    >
      <h1 className="font-semibold text-[var(--color-text-heading)] text-xl">관리자 회원가입</h1>
      <p className="text-[var(--color-text-body)] text-sm pt-1">가입 시 관리자 계정이 생성됩니다</p>

      <form className="flex flex-col w-full pt-7 gap-3.5" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="block text-[var(--color-text-label)] text-xs pb-1.5">회사 이름</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="탑세이프티컨설팅"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] transition"
          />
        </div>
        <div>
          <label className="block text-[var(--color-text-label)] text-xs pb-1.5">담당자 이름</label>
          <input
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="홍길동"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] transition"
          />
        </div>
        <div>
          <label className="block text-[var(--color-text-label)] text-xs pb-1.5">현장 이름</label>
          <input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="전남광주특별시 광산구 신창동 신창로 71번길 33, 리모델링"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] transition"
          />
        </div>
        <div>
          <label className="block text-[var(--color-text-label)] text-xs pb-1.5">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hq@example.com"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] transition"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[var(--color-text-label)] text-xs pb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm outline-none focus:border-[var(--color-accent)] transition"
            />
          </div>
          <div>
            <label className="block text-[var(--color-text-label)] text-xs pb-1.5">비밀번호 확인</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm outline-none focus:border-[var(--color-accent)] transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-[var(--color-accent)] rounded-lg h-10 text-sm font-medium text-white mt-2 hover:brightness-110 transition disabled:opacity-60"
        >
          {submitting ? "가입 중..." : "가입하기"}
        </button>
      </form>

      <p className="text-[var(--color-text-body)] text-xs text-center w-full pt-6">
        이미 계정이 있으신가요?{" "}
        <Link to="/auth/login" className="text-[var(--color-accent)] hover:underline">
          로그인
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
