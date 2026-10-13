import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import AuthCardLayout from "../components/auth/AuthCardLayout";
import { ArrowRightIcon, BarChartIcon, FileTextIcon } from "../components/auth/AuthIcons";

const FEATURES = [
  {
    icon: <BarChartIcon size={24} />,
    tone: "blue" as const,
    title: "소속 현장 위험도 대시보드",
    description: "실시간 위험도와 현황을 한눈에",
  },
  {
    icon: <FileTextIcon size={24} />,
    tone: "orange" as const,
    title: "전체 기록 통합 피드",
    description: "현장별 기록과 알림을 통합 관리",
  },
];

type Mode = "login" | "signup";

const COPY = {
  login: {
    side: "login" as const,
    eyebrow: "본사 · 현장 통합 관리자 포털",
    titleLines: ["여러 팀을", "한눈에 관리하세요"],
    heading: "어디로 로그인할까요?",
    sub: "소속에 맞는 관리자 페이지로 이동해요.",
    cta: "로그인하기",
    hq: { to: "/hq/login", desc: ["전체 현장 현황과", "계정을 관리해요"] },
    site: { to: "/auth/login", desc: ["담당 현장의 팀과", "체크리스트를 관리해요"] },
    footerText: "관리자 계정이 없으신가요?",
    footerLink: "회원가입",
    footerTo: "/auth/select/signup",
  },
  signup: {
    side: "signup" as const,
    eyebrow: "관리자 회원가입",
    titleLines: ["소속을 고르고", "바로 시작하세요"],
    heading: "어떤 계정으로 가입할까요?",
    sub: "소속에 따라 가입 절차가 달라요.",
    cta: "가입하기",
    hq: { to: "/hq/signup", desc: ["관리자 발급 코드로", "가입해요"] },
    site: { to: "/auth/signup", desc: ["담당 현장 정보로", "가입해요"] },
    footerText: "이미 계정이 있으신가요?",
    footerLink: "로그인",
    footerTo: "/auth/select",
  },
} as const;

function RoleCard({
  to,
  from,
  tone,
  icon,
  title,
  desc,
  cta,
}: {
  to: string;
  from: Mode;
  tone: "blue" | "orange";
  icon: ReactNode;
  title: string;
  desc: readonly string[];
  cta: string;
}) {
  return (
    <div
      className="flex flex-col rounded-2xl border px-[18px] pb-[18px] pt-[22px]"
      style={{ background: "var(--auth-secondary-bg)", borderColor: "var(--auth-input-border)" }}
    >
      <div
        className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px]"
        style={{
          background: tone === "blue" ? "var(--auth-tile-blue-bg)" : "var(--auth-tile-orange-bg)",
          color: tone === "blue" ? "#2f86f6" : "#ff7a3d",
        }}
      >
        {icon}
      </div>
      <p className="mt-[18px] text-[18px] font-bold leading-[1.3] text-[var(--auth-text-strong)]">{title}</p>
      <p className="mt-1.5 text-[13px] leading-5 text-[var(--auth-text-muted)]">
        {desc.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
      {/* 호버 효과는 버튼에만 — 카드는 고정 */}
      <Link
        to={to}
        state={{ authFrom: from }}
        className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[var(--auth-accent)] py-[11px] text-sm font-medium leading-[1.4] text-white transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:brightness-95"
        style={{ boxShadow: "var(--auth-btn-shadow)" }}
      >
        {cta}
        <ArrowRightIcon size={14} />
      </Link>
    </div>
  );
}

/**
 * 맨 처음 화면(스플래시 다음): 본사/현장 소속을 고른다.
 * 고른 뒤에는 스플래시 없이 각 소속의 로그인·회원가입으로 이동한다.
 */
export default function RoleSelectPage({ mode }: { mode: Mode }) {
  const c = COPY[mode];

  return (
    <AuthCardLayout
      side={c.side}
      eyebrow={c.eyebrow}
      titleLines={[...c.titleLines]}
      descriptionLines={["소속 현장 전체의 폭염 상황 · 기록 · 긴급호출을", "실시간으로 관리합니다."]}
      features={FEATURES}
      step={1}
      footerLabel="폭염가드 관리자 포털"
      hideCardHeader
      themeButtonSide={mode === "signup" ? "left" : "right"}
    >
      <div>
        <h1 className="text-[24px] font-bold leading-[1.4] text-[var(--auth-text-strong)]">{c.heading}</h1>
        <p className="text-sm leading-[1.4] text-[var(--auth-text-muted)]">{c.sub}</p>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <RoleCard to={c.hq.to} from={mode} tone="blue" icon={<BarChartIcon size={24} />} title="본사 관리자" desc={c.hq.desc} cta={c.cta} />
        <RoleCard to={c.site.to} from={mode} tone="orange" icon={<FileTextIcon size={24} />} title="현장 관리자" desc={c.site.desc} cta={c.cta} />
      </div>

      <p className="mt-7 flex justify-center gap-3 text-sm leading-[1.4]">
        <span className="text-[var(--auth-text-muted)]">{c.footerText}</span>
        <Link to={c.footerTo} state={{ authFrom: mode }} className="font-bold text-[var(--auth-accent)] hover:underline">
          {c.footerLink}
        </Link>
      </p>
    </AuthCardLayout>
  );
}
