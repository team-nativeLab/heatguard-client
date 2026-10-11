import { useState, type ReactNode } from "react";
import HomeLayout from "../components/home/HomeLayout";
import ModalShell, { btnPrimary, btnSecondary, inputCls } from "../components/home/ModalShell";
import { useToast } from "../shared/ui/Toast";
import { useSiteMe } from "../hooks/useSiteMe";
import { authApi, isDemoFallback, errorMessage } from "../api";

const MIN_PASSWORD = 4;

const smallBtn =
  "shrink-0 rounded border border-[var(--home-card-border)] bg-[var(--home-card-bg)] px-3.5 py-1.5 text-[13px] font-medium leading-[1.45] text-[var(--color-text-label)] transition hover:bg-[var(--color-bg-tile)]";

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[var(--home-card-border)] bg-[var(--home-card-bg)]">
      <div className="flex flex-col gap-0.5 px-5 py-4 leading-[1.45]">
        <h2 className="text-[15px] font-bold text-[var(--color-text-heading)]">{title}</h2>
        <p className="text-xs text-[var(--color-text-body)]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, sub, action }: { label: string; value: ReactNode; sub?: string; action: ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-t border-[var(--home-card-border)] px-5 py-3.5">
      <span className="w-[88px] shrink-0 text-[13px] leading-[1.45] text-[var(--color-text-body)] sm:w-[120px]">{label}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.45]">
        <span className="truncate text-sm font-medium text-[var(--color-text-heading)]">{value}</span>
        {sub && <span className="text-xs text-[var(--color-text-faint)]">{sub}</span>}
      </div>
      {action}
    </div>
  );
}

const fixedNote = <span className="shrink-0 text-xs leading-[1.45] text-[var(--color-text-faint)]">변경 불가</span>;

export default function AccountPage() {
  const { showToast } = useToast();
  const me = useSiteMe();
  const [changingPw, setChangingPw] = useState(false);

  const notReady = (what: string) => () => showToast(`${what} 변경은 준비 중이에요.`);

  return (
    <HomeLayout>
      <div className="flex w-full justify-center">
        <div className="flex w-full max-w-[695px] flex-col gap-6">
          <div className="flex flex-col gap-1 leading-[1.45]">
            <h1 className="text-xl font-bold text-[var(--color-text-heading)]">계정 설정</h1>
            <p className="text-[13px] text-[var(--color-text-body)]">내 정보와 로그인 보안을 관리할 수 있어요.</p>
          </div>

          <Card title="기본 정보" description="현장 관리자 계정 정보예요.">
            <Row
              label="이름"
              value={me.user.name}
              action={
                <button type="button" onClick={notReady("이름")} className={smallBtn}>
                  변경
                </button>
              }
            />
            <Row label="아이디" value={me.user.email || "-"} action={fixedNote} />
            <Row
              label="연락처"
              value={me.user.phone || "등록된 연락처가 없어요"}
              action={
                <button type="button" onClick={notReady("연락처")} className={smallBtn}>
                  변경
                </button>
              }
            />
            <Row label="소속 현장" value={me.site.name || "-"} sub="소속 변경은 본사에 요청해 주세요." action={fixedNote} />
          </Card>

          <Card title="로그인 보안" description="주기적으로 비밀번호를 바꾸면 계정을 안전하게 지킬 수 있어요.">
            <Row
              label="비밀번호"
              value="••••••••"
              action={
                <button type="button" onClick={() => setChangingPw(true)} className={smallBtn}>
                  변경
                </button>
              }
            />
          </Card>
        </div>
      </div>

      {changingPw && <PasswordModal onClose={() => setChangingPw(false)} />}
    </HomeLayout>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = async () => {
    const next: typeof errors = {};
    if (!currentPw) next.current = "현재 비밀번호를 입력해 주세요.";
    if (newPw.length < MIN_PASSWORD) next.next = `새 비밀번호는 ${MIN_PASSWORD}자 이상이어야 해요.`;
    if (newPw !== confirmPw) next.confirm = "새 비밀번호가 일치하지 않아요.";
    setErrors(next);
    if (Object.keys(next).length > 0 || submitting) return;

    setSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      showToast("비밀번호를 변경했어요.", "success");
      onClose();
    } catch (err) {
      if (isDemoFallback(err)) {
        showToast("비밀번호를 변경했어요. (데모)", "success");
        onClose();
        return;
      }
      showToast(errorMessage(err, "비밀번호 변경에 실패했어요."), "error");
      setSubmitting(false);
    }
  };

  const label = "text-xs font-medium leading-[1.45] text-[var(--color-text-label)]";
  const errCls = "text-[11px] leading-[1.45] text-[var(--color-danger-text)]";

  return (
    <ModalShell
      title="비밀번호 변경"
      maxWidth={440}
      onClose={onClose}
      busy={submitting}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={btnSecondary}>
            취소
          </button>
          <button type="button" onClick={handleChange} disabled={submitting} className={btnPrimary}>
            {submitting ? "변경 중..." : "변경"}
          </button>
        </>
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className={label}>현재 비밀번호</span>
        <input type="password" autoComplete="current-password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="현재 비밀번호 입력" className={inputCls} />
        {errors.current && <span className={errCls}>{errors.current}</span>}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={label}>새 비밀번호</span>
        <input type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="새 비밀번호 입력" className={inputCls} />
        {errors.next ? (
          <span className={errCls}>{errors.next}</span>
        ) : (
          <span className="text-[11px] leading-[1.45] text-[var(--color-text-body)]">{MIN_PASSWORD}자 이상 입력해 주세요.</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={label}>새 비밀번호 확인</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleChange()}
          placeholder="새 비밀번호 다시 입력"
          className={inputCls}
        />
        {errors.confirm && <span className={errCls}>{errors.confirm}</span>}
      </label>
    </ModalShell>
  );
}
