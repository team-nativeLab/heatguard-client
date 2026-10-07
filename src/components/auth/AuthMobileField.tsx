import { useId, type InputHTMLAttributes, type ReactNode } from "react";

interface AuthMobileFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** 라벨 오른쪽 보조 영역 (예: 비밀번호 찾기) */
  labelAside?: ReactNode;
  /** 에러 문구. 있으면 입력창이 빨간 테두리·배경으로 바뀐다. */
  error?: string;
  /** login = 높이 45 / signup = 높이 44 */
  variant?: "login" | "signup";
}

export default function AuthMobileField({
  label,
  labelAside,
  error,
  variant = "login",
  id,
  className = "",
  ...inputProps
}: AuthMobileFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const isLogin = variant === "login";

  return (
    <div className={className}>
      <div className="flex items-center justify-between pb-2">
        <label htmlFor={inputId} className="text-[13px] font-bold leading-[1.3] text-[var(--auth-m-text-strong)]">
          {label}
        </label>
        {labelAside}
      </div>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full border-[1.5px] px-4 text-[var(--auth-m-text-strong)] outline-none transition-colors placeholder:text-[var(--auth-m-text-sub)] ${
          isLogin ? "h-[45px] rounded-xl text-[14px]" : "h-11 rounded-[11px] text-[13px]"
        } ${
          error
            ? "border-[var(--auth-m-danger)] bg-[var(--auth-m-input-error-bg)]"
            : `border-transparent focus:border-[var(--auth-m-accent)] ${
                isLogin ? "bg-[var(--auth-m-input-bg)]" : "bg-[var(--auth-m-input-bg-soft)]"
              }`
        }`}
        {...inputProps}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="pt-2 text-[13px] leading-[1.3] text-[var(--auth-m-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
