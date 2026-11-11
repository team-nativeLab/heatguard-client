import { useEffect, useState, type FormEvent } from "react";
import ModalShell, { btnPrimary, btnSecondary, inputCls } from "../home/ModalShell";
import { sendEmailCode, verifyEmailCode } from "../../api/emailVerification";
import { ApiError } from "../../api/client";

export interface EmailChangePayload {
  email: string;
  currentPassword: string;
  verificationToken: string;
}

export default function EmailChangeModal({
  currentEmail,
  onClose,
  onSave,
}: {
  currentEmail: string;
  onClose: () => void;
  onSave: (payload: EmailChangePayload) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const sendCode = async () => {
    const normalized = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError("새 이메일 주소를 확인해주세요.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await sendEmailCode(normalized);
      setVerified(false);
      setVerificationToken("");
      setCode("");
      setCooldown(60);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "인증코드를 보내지 못했어요.");
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (!email.trim() || !/^\d{6}$/.test(code.trim())) {
      setError("이메일과 6자리 인증코드를 확인해주세요.");
      return;
    }
    setChecking(true);
    setError("");
    try {
      const result = await verifyEmailCode(email.trim(), code.trim());
      if (!result || typeof result !== "object" || (result as Record<string, unknown>).verified !== true || typeof (result as Record<string, unknown>).verificationToken !== "string") {
        throw new Error("인증 결과를 확인하지 못했어요. 코드를 다시 확인해주세요.");
      }
      setVerificationToken((result as { verificationToken: string }).verificationToken);
      setVerified(true);
    } catch (err) {
      setVerified(false);
      setVerificationToken("");
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "이메일 인증에 실패했어요.");
    } finally {
      setChecking(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!verified || !verificationToken) {
      setError("새 이메일 인증을 완료해주세요.");
      return;
    }
    if (!currentPassword) {
      setError("현재 비밀번호를 입력해주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ email: email.trim(), currentPassword, verificationToken });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "이메일을 변경하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="이메일 변경"
      onClose={onClose}
      busy={saving}
      footer={<><button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>취소</button><button type="submit" form="email-change-form" className={btnPrimary} disabled={saving || !verified}>{saving ? "변경 중..." : "이메일 변경"}</button></>}
    >
      <form id="email-change-form" onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-xs leading-5 text-[var(--color-text-body)]">현재 이메일: {currentEmail}</p>
        <div>
          <label htmlFor="email-change-new" className="mb-1.5 block text-xs font-medium text-[var(--color-text-label)]">새 이메일</label>
          <div className="flex gap-2">
            <input id="email-change-new" type="email" autoComplete="email" className={inputCls} value={email} disabled={verified || saving} onChange={(event) => { setEmail(event.target.value); setVerified(false); setVerificationToken(""); setError(""); }} />
            <button type="button" className={btnSecondary} disabled={sending || cooldown > 0 || verified || saving} onClick={sendCode}>{sending ? "발송 중..." : cooldown > 0 ? `${cooldown}초 후 재발송` : "인증코드 발송"}</button>
          </div>
        </div>
        <div>
          <label htmlFor="email-change-code" className="mb-1.5 block text-xs font-medium text-[var(--color-text-label)]">이메일 인증코드</label>
          <div className="flex gap-2">
            <input id="email-change-code" inputMode="numeric" maxLength={6} className={inputCls} value={code} disabled={verified || saving} onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} placeholder="6자리 인증코드" />
            <button type="button" className={btnSecondary} disabled={checking || verified || saving} onClick={verify}>{checking ? "확인 중..." : verified ? "인증 완료" : "인증 확인"}</button>
          </div>
        </div>
        <div>
          <label htmlFor="email-change-password" className="mb-1.5 block text-xs font-medium text-[var(--color-text-label)]">현재 비밀번호</label>
          <input id="email-change-password" type="password" autoComplete="current-password" className={inputCls} value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setError(""); }} />
        </div>
        {verified && <p role="status" className="text-xs text-emerald-600">이메일 인증이 완료됐어요.</p>}
        {error && <p role="alert" className="text-xs text-[var(--color-danger-text)]">{error}</p>}
      </form>
    </ModalShell>
  );
}
