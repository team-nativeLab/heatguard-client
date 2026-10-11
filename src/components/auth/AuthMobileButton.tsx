import type { ButtonHTMLAttributes } from "react";

export default function AuthMobileButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className={`h-[42px] w-full rounded-[14px] bg-[var(--auth-m-accent)] text-[15px] font-bold text-white transition hover:brightness-105 active:brightness-95 disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
