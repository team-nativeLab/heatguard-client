import { useState } from "react";
import ManagerLayout from "../../components/manager/ManagerLayout";
import { useToast } from "../../components/ui/Toast";

export default function Screen20_계정설정_사본() {
  const { showToast } = useToast();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handleChange = () => {
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
    showToast("비밀번호를 변경했어요.", "success");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  };

  return (
    <ManagerLayout>
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
              className="bg-[var(--color-accent)] h-10 w-full rounded text-sm font-medium text-white mt-2 hover:brightness-110 transition"
            >
              변경
            </button>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
