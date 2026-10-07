import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon } from "./AuthIcons";

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  /** 입력창 왼쪽 아이콘 */
  icon: ReactNode;
  /** 라벨 우측 보조 영역 (예: 비밀번호 찾기) */
  labelAside?: ReactNode;
  /** 에러 메시지. 있으면 테두리·문구가 빨간색으로 바뀐다. */
  error?: string;
  /** lg = 로그인(높이 48), md = 회원가입(높이 44) */
  size?: "lg" | "md";
  /** type="password"일 때 눈 아이콘으로 표시/숨김 토글 */
  revealable?: boolean;
}

export default function AuthField({
  label,
  icon,
  labelAside,
  error,
  size = "lg",
  revealable = false,
  type = "text",
  id,
  className = "",
  ...inputProps
}: AuthFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [revealed, setRevealed] = useState(false);
  const isLg = size === "lg";
  const inputType = type === "password" && revealed ? "text" : type;

  return (
    <div className={`flex flex-col ${isLg ? "gap-2" : "gap-1.5"} ${className}`}>
      <div className="flex items-start justify-between">
        <label htmlFor={inputId} className={`font-bold leading-[1.4] text-[var(--auth-text-strong)] ${isLg ? "text-sm" : "text-[13px]"}`}>
          {label}
        </label>
        {labelAside}
      </div>

      <div
        className={`flex items-center gap-3 rounded-[10px] border bg-[var(--auth-input-bg)] px-4 transition-colors ${
          isLg ? "h-12" : "h-11"
        } ${
          error
            ? "border-[var(--auth-danger)]"
            : "border-[var(--auth-input-border)] focus-within:border-[var(--auth-accent)]"
        }`}
      >
        <span className="flex shrink-0 items-center text-[var(--auth-text-muted)]">{icon}</span>
        <input
          id={inputId}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="min-w-0 flex-1 bg-transparent text-sm leading-[1.4] text-[var(--auth-text-strong)] outline-none placeholder:text-[var(--auth-text-muted)]"
          {...inputProps}
        />
        {revealable && type === "password" && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "비밀번호 숨기기" : "비밀번호 보기"}
            className="flex shrink-0 items-center text-[var(--auth-text-muted)] transition-colors hover:text-[var(--auth-text-strong)]"
          >
            {revealed ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs leading-[1.4] text-[var(--auth-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
