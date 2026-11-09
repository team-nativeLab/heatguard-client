import { useId, type ChangeEvent } from "react";
import type { useEmailVerification } from "../../hooks/useEmailVerification";
import { MailIcon } from "./AuthIcons";

export default function EmailVerification({ email, onEmailChange, emailError, verification: v, disabled = false, error, onEdit }: {
  email: string;
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  emailError?: string;
  verification: ReturnType<typeof useEmailVerification>;
  disabled?: boolean;
  error?: string;
  onEdit: () => void;
}) {
  const emailId = useId();
  const codeId = useId();
  const emailFieldError = emailError || (!v.sent ? v.error : undefined);
  const codeError = error || (v.sent ? v.error : undefined);
  const canSend = !disabled && !v.sending && !v.verifying && !v.verified && v.cooldown <= 0;

  return (
    <div className="mb-3 flex flex-col gap-5">
      <div>
        <label htmlFor={emailId} className="mb-1.5 block text-[13px] font-medium leading-[1.4] text-[var(--auth-text-strong)]">이메일</label>
        <div className="flex items-center gap-2">
          <div className={`flex h-11 min-w-0 flex-1 items-center gap-3 rounded-[10px] border bg-[var(--auth-input-bg)] px-4 transition-colors ${
            emailFieldError ? "border-[var(--auth-danger)]" : "border-[var(--auth-input-border)] focus-within:border-[var(--auth-accent)]"
          }`}>
            <span className="flex shrink-0 items-center text-[var(--auth-text-muted)]"><MailIcon /></span>
            <input
              id={emailId}
              type="email"
              autoComplete="username"
              placeholder="Ex. honggildong@email.com"
              value={email}
              disabled={disabled || v.sending || v.verifying}
              onChange={onEmailChange}
              aria-invalid={emailFieldError ? true : undefined}
              aria-describedby={emailFieldError ? `${emailId}-error` : undefined}
              className="min-w-0 flex-1 bg-transparent text-sm font-normal leading-[1.4] text-[var(--auth-text-strong)] outline-none placeholder:text-[var(--auth-text-muted)]"
            />
          </div>
          <button
            type="button"
            onClick={() => { onEdit(); void v.send(); }}
            disabled={!canSend}
            className="h-11 shrink-0 rounded-[10px] border border-[var(--auth-input-border)] bg-[var(--auth-input-bg)] px-3 text-sm font-semibold text-[var(--auth-accent)] transition hover:border-[var(--auth-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {v.sending ? "발송 중..." : "인증코드발송"}
          </button>
        </div>
        {emailFieldError && <p id={`${emailId}-error`} role="alert" className="mt-1.5 text-xs leading-[1.4] text-[var(--auth-danger)]">{emailFieldError}</p>}
      </div>

      <div>
        <label htmlFor={codeId} className="mb-1.5 block text-sm font-medium leading-[1.4] text-[var(--auth-text-strong)]">인증번호를 입력해주세요.</label>
        <div className="flex items-center gap-2">
          <div className={`flex h-11 min-w-0 flex-1 items-center gap-3 rounded-[10px] border bg-[var(--auth-input-bg)] px-4 transition-colors ${
            codeError ? "border-[var(--auth-danger)]" : "border-[var(--auth-input-border)] focus-within:border-[var(--auth-accent)]"
          }`}>
            <span className="flex shrink-0 items-center text-[var(--auth-text-muted)]"><MailIcon /></span>
            <input
              id={codeId}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="인증번호 입력"
              value={v.code}
              disabled={disabled || v.sending || v.verifying}
              onChange={(event) => {
                onEdit();
                v.setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              aria-invalid={codeError ? true : undefined}
              aria-describedby={codeError ? `${codeId}-error` : undefined}
              className="min-w-0 flex-1 bg-transparent text-sm font-normal leading-[1.4] text-[var(--auth-text-strong)] outline-none placeholder:text-[var(--auth-text-muted)]"
            />
          </div>
          <button
            type="button"
            onClick={() => { onEdit(); void v.verify(); }}
            disabled={disabled || v.sending || v.verifying || !v.sent || v.remaining <= 0 || !/^\d{6}$/.test(v.code) || v.verified}
            className="h-11 shrink-0 rounded-[10px] border border-[var(--auth-input-border)] bg-[var(--auth-secondary-bg)] px-4 text-sm font-semibold text-[var(--auth-text-strong)] transition hover:border-[var(--auth-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {v.verifying ? "확인 중..." : "확인"}
          </button>
        </div>
        {codeError && <p id={`${codeId}-error`} role="alert" className="mt-1.5 text-xs leading-[1.4] text-[var(--auth-danger)]">{codeError}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--auth-text-muted)]" role="status" aria-live="polite">
          {v.verified ? (
            <span className="font-medium text-[var(--auth-accent)]">이메일 인증 완료</span>
          ) : v.sent && v.remaining > 0 ? (
            <>
              <span>인증번호 유효시간 {String(Math.floor(v.remaining / 60)).padStart(2, "0")}:{String(v.remaining % 60).padStart(2, "0")}</span>
              <button
                type="button"
                onClick={() => { onEdit(); void v.send(); }}
                disabled={!canSend}
                className="font-medium text-[var(--auth-accent)] underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {v.cooldown > 0 ? `${v.cooldown}초 후 재발송` : "인증코드 재발송"}
              </button>
            </>
          ) : v.sent ? (
            <>
              <span>인증번호가 만료됐어요.</span>
              <button type="button" onClick={() => { onEdit(); void v.send(); }} disabled={!canSend}
                className="font-medium text-[var(--auth-accent)] underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {v.cooldown > 0 ? `${v.cooldown}초 후 재발송` : "인증코드 재발송"}
              </button>
            </>
          ) : (
            <span>인증번호를 발송해주세요.</span>
          )}
        </div>
      </div>
    </div>
  );
}
