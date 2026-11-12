import { useId, type ComponentProps, type InputHTMLAttributes } from "react";
import AuthField from "./AuthField";
import {
  getPasswordError,
  PASSWORD_POLICY_HINT,
} from "../../lib/passwordPolicy";

/**
 * 입력 중 바로 보여줄 오류.
 * 확인란은 입력 중 길이를 지적하지 않는다 — 불일치 검사는 각 화면에서
 * 제출 시점에 getPasswordConfirmationError로 처리한다.
 */
function getDraftError(password: string, confirmation: boolean, minimumLength?: number) {
  if (!password || confirmation) return undefined;
  return getPasswordError(password, minimumLength);
}

type NewPasswordAuthFieldProps = Omit<ComponentProps<typeof AuthField>, "type" | "autoComplete" | "value"> & {
  value: string;
  confirmation?: boolean;
  minimumLength?: number;
  policyHint?: string;
};

export function NewPasswordAuthField({
  value,
  confirmation = false,
  error,
  minimumLength,
  policyHint = PASSWORD_POLICY_HINT,
  id,
  ...fieldProps
}: NewPasswordAuthFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const draftError = getDraftError(value, confirmation, minimumLength) ?? error;
  const describedBy = [
    draftError ? `${inputId}-error` : "",
    !confirmation ? `${inputId}-policy` : "",
  ].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <AuthField
        {...fieldProps}
        id={inputId}
        type="password"
        autoComplete="new-password"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        error={draftError}
        aria-describedby={describedBy}
      />
      {!confirmation && (
        <p id={`${inputId}-policy`} className="mb-4 -mt-2 text-xs leading-5 text-[var(--auth-text-muted)]">
          {policyHint}
        </p>
      )}
    </div>
  );
}

type NewPasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "autoComplete" | "value"> & {
  value: string;
  confirmation?: boolean;
  error?: string;
  minimumLength?: number;
  policyHint?: string;
};

export function NewPasswordInput({
  value,
  confirmation = false,
  error,
  minimumLength,
  policyHint = PASSWORD_POLICY_HINT,
  id,
  ...inputProps
}: NewPasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const draftError = getDraftError(value, confirmation, minimumLength) ?? error;
  const describedBy = [
    draftError ? `${inputId}-error` : "",
    !confirmation ? `${inputId}-policy` : "",
  ].filter(Boolean).join(" ") || undefined;
  return (
    <>
      <input
        {...inputProps}
        id={inputId}
        type="password"
        autoComplete="new-password"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        aria-invalid={draftError ? true : undefined}
        aria-describedby={describedBy}
      />
      {draftError && (
        <span id={`${inputId}-error`} role="alert" className="text-xs leading-5 text-[var(--color-danger-text)]">
          {draftError}
        </span>
      )}
      {!confirmation && (
        <span id={`${inputId}-policy`} className="text-xs leading-5 text-[var(--color-text-body)]">
          {policyHint}
        </span>
      )}
    </>
  );
}
