import { useId, type ComponentProps, type InputHTMLAttributes } from "react";
import AuthField from "./AuthField";
import {
  getPasswordCharacterError,
  getPasswordError,
  PASSWORD_POLICY_HINT,
} from "../../lib/passwordPolicy";

function getDraftError(password: string, confirmation: boolean) {
  if (!password) return undefined;
  return confirmation ? getPasswordCharacterError(password) : getPasswordError(password);
}

type NewPasswordAuthFieldProps = Omit<ComponentProps<typeof AuthField>, "type" | "autoComplete" | "value"> & {
  value: string;
  confirmation?: boolean;
};

export function NewPasswordAuthField({
  value,
  confirmation = false,
  error,
  id,
  ...fieldProps
}: NewPasswordAuthFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const draftError = getDraftError(value, confirmation) ?? error;
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
          {PASSWORD_POLICY_HINT}
        </p>
      )}
    </div>
  );
}

type NewPasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "autoComplete" | "value"> & {
  value: string;
  confirmation?: boolean;
  error?: string;
};

export function NewPasswordInput({
  value,
  confirmation = false,
  error,
  id,
  ...inputProps
}: NewPasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const draftError = getDraftError(value, confirmation) ?? error;
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
          {PASSWORD_POLICY_HINT}
        </span>
      )}
    </>
  );
}
