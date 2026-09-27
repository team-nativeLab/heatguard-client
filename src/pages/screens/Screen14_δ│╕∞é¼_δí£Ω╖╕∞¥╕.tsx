import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";
import { useToast } from "../../components/ui/Toast";
import { authApi, isNetworkError, ApiError } from "../../api";

const DEMO_EMAIL = "hq@example.com";
const DEMO_PASSWORD = "demo1234";

export default function Screen14_본사_로그인() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await authApi.login({ email: email || DEMO_EMAIL, password: password || DEMO_PASSWORD });
      navigate("/manager");
    } catch (err) {
      if (isNetworkError(err)) {

        showToast("서버 연결 없이 데모 모드로 진행할게요.", "default");
        navigate("/manager");
        return;
      }
      const message = err instanceof ApiError ? err.message : "로그인에 실패했어요.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout
      eyebrow="관리자 포털"
      titleLines={["여러 팀을", "한눈에 관리하세요"]}
      description="소속 현장 전체의 폭염 상황·기록·긴급호출을 실시간으로 관리합니다."
      bullets={["소속 현장 위험도 순 대시보드", "전체 기록 통합 피드"]}
    >
      <h1 className="font-semibold text-[var(--color-text-heading)] text-xl">관리자 로그인</h1>
      <p className="text-[var(--color-text-body)] text-sm pt-1">관리자 계정으로 로그인해주세요</p>

      <form className="flex flex-col w-full pt-7 gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-[var(--color-text-label)] text-xs pb-1.5">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={DEMO_EMAIL}
            autoComplete="username"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm outline-none focus:border-[var(--color-accent)] transition"
          />
        </div>
        <div>
          <div className="flex items-center justify-between pb-1.5">
            <label className="text-[var(--color-text-label)] text-xs">비밀번호</label>
            <button type="button" className="text-[var(--color-text-body)] text-[11px] hover:text-[var(--color-text-label)]">
              비밀번호 찾기
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm outline-none focus:border-[var(--color-accent)] transition"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-[var(--color-accent)] rounded-lg h-10 text-sm font-medium text-white mt-2 hover:brightness-110 transition disabled:opacity-60"
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <div className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-3 w-full mt-4">
        <p className="text-[var(--color-text-body)] text-[11px]">
          데모 계정이 자동 입력됩니다 —{" "}
          <span className="font-['JetBrains_Mono',monospace] text-[var(--color-text-label)]">{DEMO_EMAIL}</span>
        </p>
      </div>

      <p className="text-[var(--color-text-body)] text-xs text-center w-full pt-6">
        관리자 계정이 없으신가요?{" "}
        <Link to="/auth/signup" className="text-[var(--color-accent)] hover:underline">
          회원가입
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
