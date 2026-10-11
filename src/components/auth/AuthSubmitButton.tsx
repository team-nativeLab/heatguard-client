import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowRightIcon } from "./AuthIcons";

export default function AuthSubmitButton({
  children,
  className = "",
  ...props
}: { children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--auth-accent)] text-base font-medium leading-[1.4] text-white transition hover:brightness-105 active:brightness-95 disabled:opacity-60 ${className}`}
      style={{ boxShadow: "var(--auth-btn-shadow)" }}
      {...props}
    >
      {children}
      <ArrowRightIcon />
    </button>
  );
}
