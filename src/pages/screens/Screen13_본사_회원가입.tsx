import { Link, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";

export default function Screen13_본사_회원가입() {
  const navigate = useNavigate();

  return (
    <AuthSplitLayout
      eyebrow="관리자 회원가입"
      titleLines={["가입 즉시", "현장 관리자가 됩니다"]}
      titleClassName="text-[24px] leading-[33px]"
      description="현장관리자 계정 생성 후, 작업자 계정을 추가하고 소속 현장을 관리할 수 있습니다."
    >
      <h1 className="font-semibold text-[var(--color-text-heading)] text-xl">관리자 회원가입</h1>
      <p className="text-[var(--color-text-body)] text-sm pt-1">가입 시 관리자 계정이 생성됩니다</p>

      <form
        className="flex flex-col w-full pt-7 gap-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          navigate("/auth/login");
        }}
      >
        <div>
          <label className="block text-[var(--color-text-label)] text-xs pb-1.5">회사 이름</label>
          <input
            placeholder="탑세이프티컨설팅"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] transition"
          />
        </div>
        <div>
          <label className="block text-[var(--color-text-label)] text-xs pb-1.5">담당자 이름</label>
          <input
            placeholder="홍길동"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] transition"
          />
        </div>
        <div>
          <label className="block text-[var(--color-text-label)] text-xs pb-1.5">현장 이름</label>
          <input
            placeholder="전남광주특별시 광산구 신창동 신창로 71번길 33, 리모델링"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] transition"
          />
        </div>
        <div>
          <label className="block text-[var(--color-text-label)] text-xs pb-1.5">이메일</label>
          <input
            type="email"
            placeholder="hq@example.com"
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] transition"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[var(--color-text-label)] text-xs pb-1.5">비밀번호</label>
            <input
              type="password"
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm outline-none focus:border-[var(--color-accent)] transition"
            />
          </div>
          <div>
            <label className="block text-[var(--color-text-label)] text-xs pb-1.5">비밀번호 확인</label>
            <input
              type="password"
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[42px] px-3 w-full text-[var(--color-text-heading)] text-sm outline-none focus:border-[var(--color-accent)] transition"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-[var(--color-accent)] rounded-lg h-10 text-sm font-medium text-white mt-2 hover:brightness-110 transition"
        >
          가입하기
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
