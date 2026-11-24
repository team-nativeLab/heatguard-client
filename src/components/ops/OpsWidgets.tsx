import type { ReactNode } from "react";
import OpsIcon, { type OpsIconName } from "./OpsIcon";
import type { DashboardAccess } from "../../api";
import { accessShares, formatCount } from "../../lib/opsDashboard";
import { CARD, DONUT_COLORS } from "./opsStyles";

/* 운영자 콘솔 화면들이 함께 쓰는 카드·지표·차트 (Figma 운영자 콘솔). */


export interface Delta {
  value: string;
  caption: string;
  trend: "up" | "down" | "flat";
}

export function KpiCard({ label, value, icon, delta, chip }: {
  label: string;
  value: number | null | undefined;
  icon: OpsIconName;
  delta?: Delta;
  chip?: string;
}) {
  const tone = delta?.trend === "up"
    ? "text-[var(--ops-success-fg)]"
    : delta?.trend === "down"
      ? "text-[var(--color-danger-text)]"
      : "text-[var(--ops-faint)]";
  const arrow = delta?.trend === "up" ? "▲ " : delta?.trend === "down" ? "▼ " : "";
  return (
    <div className={`${CARD} flex h-[120px] min-w-0 flex-col p-[15px]`}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-[var(--ops-accent-soft)] text-[var(--ops-accent)]">
          <OpsIcon name={icon} />
        </span>
        <span className="truncate whitespace-nowrap text-[13px] font-medium text-[var(--ops-body)]" title={label}>{label}</span>
      </div>
      <span className="font-mono-num mt-auto text-2xl font-bold leading-[1.4] text-[var(--ops-heading)]">
        {value == null ? "–" : formatCount(value)}
      </span>
      <div className="mt-1 flex h-[21px] min-w-0 items-center gap-1.5 text-xs">
        {chip ? (
          <span className="rounded-full bg-[var(--ops-warning-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--ops-warning-fg)]">{chip}</span>
        ) : delta ? (
          <>
            <span className={`font-mono-num shrink-0 font-medium ${tone}`}>{arrow}{delta.value}</span>
            <span className="truncate text-[var(--ops-faint)]">{delta.caption}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function Panel({ icon, title, action, children, className = "" }: {
  icon: OpsIconName;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-label={title} className={`${CARD} flex min-w-0 flex-col p-[19px] ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-[var(--ops-heading)]">
          <OpsIcon name={icon} size={18} className="text-[var(--ops-heading)]" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const DONUT_SIZE = 164;
const DONUT_STROKE = 24;

export function AccessDonut({ access }: { access: DashboardAccess }) {
  const shares = accessShares(access.items);
  const r = (DONUT_SIZE - DONUT_STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-1 flex-wrap items-center justify-around gap-6 pt-4">
      <div className="relative" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
        <svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`} className="-rotate-90" aria-hidden>
          <circle cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={r} fill="none" stroke="var(--ops-chip-bg)" strokeWidth={DONUT_STROKE} />
          {access.total > 0 && access.items.map((item, i) => {
            const length = (shares[i] / 100) * circumference;
            const segment = (
              <circle
                key={item.role}
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={r}
                fill="none"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth={DONUT_STROKE}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return segment;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-[var(--ops-faint)]">전체 접속</span>
          <span className="font-mono-num text-[22px] font-bold text-[var(--ops-heading)]">{formatCount(access.total)}회</span>
        </div>
      </div>
      <ul className="flex min-w-[220px] flex-col gap-6">
        {access.items.map((item, i) => (
          <li key={item.role} className="flex items-start gap-2">
            <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} aria-hidden />
            <span className="flex-1 text-sm font-medium text-[var(--ops-body)]">폭염가드 ({item.label})</span>
            <span className="flex flex-col items-end">
              <span className="font-mono-num text-base font-bold text-[var(--ops-heading)]">{shares[i].toFixed(1)}%</span>
              <span className="font-mono-num text-xs text-[var(--ops-faint)]">{formatCount(item.count)}회</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
