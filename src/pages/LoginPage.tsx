import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import ConfirmDialog from "../shared/ui/ConfirmDialog";
import { useToast } from "../shared/ui/Toast";
import { markSignedIn } from "../shared/auth/RequireAuth";
import { clearSiteMeCache } from "../hooks/useSiteMe";
import { authApi, ApiError, isDemoFallback, errorMessage } from "../api";

const DEMO_EMAIL = "hq@example.com";
const DEMO_PASSWORD = "demo1234";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  "bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] transition";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // 로그인 가드가 보낸 경우 원래 보던 화면으로 돌아간다.
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/manager";
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showFindPw, setShowFindPw] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!email.trim() || !password) return showToast("이메일과 비밀번호를 입력해주세요.", "error");
    if (!EMAIL_RE.test(email.trim())) return showToast("이메일 형식을 확인해주세요.", "error");

    setSubmitting(true);
    try {
      await authApi.login({ email: email.trim(), password });
      clearSiteMeCache();
      markSignedIn();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (isDemoFallback(err)) {
        showToast("서버 연결 없이 데모 모드로 진행할게요.");
        navigate(redirectTo, { replace: true });
        return;
      }
      if (err instanceof ApiError && err.status === 401) {
        showToast("이메일 또는 비밀번호가 올바르지 않아요.", "error");
      } else {
        showToast(errorMessage(err, "로그인에 실패했어요."), "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
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

      <form className="flex flex-col w-full pt-7 gap-4" onSubmit={handleSubmit} noValidate>
        <label className="block">
          <span className="block text-[var(--color-text-label)] text-xs pb-1.5">이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={DEMO_EMAIL}
            autoComplete="username"
            className={inputCls}
          />
        </label>
        <div>
          <div className="flex items-center justify-between pb-1.5">
            <label htmlFor="login-password" className="text-[var(--color-text-label)] text-xs">
              비밀번호
            </label>
            <button
              type="button"
              onClick={() => setShowFindPw(true)}
              className="text-[var(--color-text-body)] text-[11px] hover:text-[var(--color-text-label)]"
            >
              비밀번호 찾기
            </button>
          </div>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={inputCls}
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

      <button
        type="button"
        onClick={fillDemo}
        className="text-left bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-3 w-full mt-4 hover:border-[var(--color-accent)] transition"
      >
        <p className="text-[var(--color-text-body)] text-[11px]">
          데모 계정으로 채우기 —{" "}
          <span className="font-['JetBrains_Mono',monospace] text-[var(--color-text-label)]">{DEMO_EMAIL}</span>
        </p>
      </button>

      <p className="text-[var(--color-text-body)] text-xs text-center w-full pt-6">
        관리자 계정이 없으신가요?{" "}
        <Link to="/auth/signup" className="text-[var(--color-accent)] hover:underline">
          회원가입
        </Link>
      </p>

      {showFindPw && (
        <ConfirmDialog
          title="비밀번호를 잊으셨나요?"
          description={"보안을 위해 비밀번호 재설정은 담당자 확인 후 진행돼요.\n가입한 이메일과 현장 이름을 운영팀에 알려주세요."}
          confirmLabel="확인"
          hideCancel
          onConfirm={() => setShowFindPw(false)}
          onCancel={() => setShowFindPw(false)}
        />
      )}
    </AuthSplitLayout>
  );
}
