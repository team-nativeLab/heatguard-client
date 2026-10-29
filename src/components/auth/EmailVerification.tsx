import type { useEmailVerification } from "../../hooks/useEmailVerification";
import AuthField from "./AuthField";
import { MailIcon } from "./AuthIcons";

export default function EmailVerification({ email, verification: v, disabled = false, error, onEdit }: {
  email: string;
  verification: ReturnType<typeof useEmailVerification>;
  disabled?: boolean;
  error?: string;
  onEdit: () => void;
}) {
  return (
    <div className="mb-3">
      <AuthField size="md" label="이메일 인증코드" icon={<MailIcon />} placeholder="6자리 숫자" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
        className="!pb-1" value={v.code} disabled={disabled || v.sending || v.verifying} error={v.error || error}
        onChange={(event) => {
          onEdit();
          v.setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
        }}
        labelAside={
          <button type="button" onClick={() => { onEdit(); void v.send(); }} disabled={disabled || v.sending || v.verifying || v.cooldown > 0}
            className="text-xs font-medium text-[var(--auth-accent)] hover:underline disabled:cursor-not-allowed disabled:opacity-50">
            {v.sending ? "발송 중..." : v.cooldown > 0 ? `${v.cooldown}초 후 재발송` : v.sent ? "인증코드 재발송" : "인증코드 발송"}
          </button>
        }
      />
      <button type="button" onClick={() => { onEdit(); void v.verify(); }}
        disabled={disabled || v.sending || v.verifying || !v.sent || v.remaining <= 0 || !/^\d{6}$/.test(v.code) || v.verified}
        className="mb-2 text-sm font-medium text-[var(--auth-accent)] hover:underline disabled:cursor-not-allowed disabled:opacity-50">
        {v.verifying ? "인증 확인 중..." : "인증 확인"}
      </button>
      <p role="status" aria-live="polite" className="text-xs text-[var(--auth-text-muted)]">{v.verified ? "이메일 인증이 완료됐어요. 다음으로 진행해주세요." : "이메일 인증을 완료해야 다음으로 진행할 수 있어요."}</p>
      <p className="break-all text-xs leading-relaxed text-[var(--auth-text-muted)]">{email.trim()} 주소로 발송합니다.</p>
      {v.sent && <p className="text-xs leading-relaxed text-[var(--auth-text-muted)]">
        {v.remaining > 0 ? `${Math.floor(v.remaining / 60)}:${String(v.remaining % 60).padStart(2, "0")} 남음 · 인증을 완료한 후 비밀번호를 설정합니다.` : "인증코드가 만료됐어요. 다시 발송해주세요."}
      </p>}
    </div>
  );
}
