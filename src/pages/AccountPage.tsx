import { useState } from "react";
import HomeLayout from "../components/home/HomeLayout";
import { useToast } from "../shared/ui/Toast";
import { authApi, isDemoFallback, errorMessage } from "../api";

export default function AccountPage() {
  const { showToast } = useToast();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = async () => {
    if (!currentPw) {
      showToast("현재 비밀번호를 입력해주세요.", "error");
      return;
    }
    if (newPw.length < 4) {
      showToast("새 비밀번호는 4자 이상이어야 해요.", "error");
      return;
    }
    if (newPw !== confirmPw) {
      showToast("새 비밀번호가 일치하지 않아요.", "error");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      showToast("비밀번호를 변경했어요.", "success");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      if (isDemoFallback(err)) {
        showToast("비밀번호를 변경했어요. (데모)", "success");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        return;
      }
      showToast(errorMessage(err, "비밀번호 변경에 실패했어요."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HomeLayout>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[384px] flex flex-col items-start">
          <h1 className="font-semibold text-xl text-[var(--color-text-heading)] leading-7">계정 설정</h1>

          <div className="flex flex-col w-full pt-6 gap-4">
            <label className="flex flex-col w-full gap-1.5">
              <span className="text-[var(--color-text-body)] text-xs leading-4">현재 비밀번호</span>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded h-[38px] w-full px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </label>

            <label className="flex flex-col w-full gap-1.5">
              <span className="text-[var(--color-text-body)] text-xs leading-4">새 비밀번호 (4자 이상)</span>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded h-[38px] w-full px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </label>

            <label className="flex flex-col w-full gap-1.5">
              <span className="text-[var(--color-text-body)] text-xs leading-4">새 비밀번호 확인</span>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChange()}
                className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded h-[38px] w-full px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </label>

            <button
              type="button"
              onClick={handleChange}
              disabled={submitting}
              className="bg-[var(--color-accent)] h-10 w-full rounded text-sm font-medium text-white mt-2 hover:brightness-110 transition disabled:opacity-60"
            >
              {submitting ? "변경 중..." : "변경"}
            </button>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
