import type { ReactNode } from "react";
import logo from "../../assets/images/logo.png";
import ThemeToggleButton from "../ui/ThemeToggleButton";

export default function AuthSplitLayout({
  eyebrow,
  titleLines,
  titleClassName = "text-[30px] leading-[41.25px]",
  description,
  bullets,
  children,
}: {
  eyebrow: string;
  titleLines: string[];
  titleClassName?: string;
  description: string;
  bullets?: string[];
  children: ReactNode;
}) {
  return (
    <div className="bg-[var(--color-bg-app)] min-h-screen w-full flex relative">
      <div className="hidden md:flex flex-col bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] w-[420px] shrink-0 relative overflow-hidden px-10 py-10 justify-between">
        <div className="flex gap-2.5 items-center">
          <div className="bg-[#0f172a] flex items-center justify-center rounded shrink-0 size-7 overflow-hidden">
            <img alt="폭염가드 로고" className="size-[25px] object-cover" src={logo} />
          </div>
          <p className="font-semibold leading-[21px] text-sm text-[var(--color-text-heading)]">폭염가드</p>
        </div>

        <div>
          <p className="font-['JetBrains_Mono',monospace] leading-[15px] text-[var(--color-accent)] text-[10px] tracking-[1px]">
            {eyebrow}
          </p>
          <div className="font-light text-[var(--color-text-heading)] pt-3">
            {titleLines.map((line) => (
              <p key={line} className={titleClassName}>
                {line}
              </p>
            ))}
          </div>
          <p className="text-[var(--color-text-body)] text-sm leading-[22.75px] pt-4">{description}</p>

          {bullets && bullets.length > 0 && (
            <div className="flex flex-col gap-3 pt-8">
              {bullets.map((bullet) => (
                <div key={bullet} className="flex gap-2.5 items-center">
                  <span className="bg-[var(--color-accent)] rounded-full shrink-0 size-1" />
                  <p className="text-[var(--color-text-label)] text-sm">{bullet}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="flex flex-col items-start w-full max-w-[384px]">{children}</div>
      </div>

      <ThemeToggleButton className="absolute right-4 top-4" />
    </div>
  );
}
