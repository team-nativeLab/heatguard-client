import type { HqRecordRow, HeatTone } from "../../api";

function toneClass(tone: string) {
  if (tone === "red") return "bg-[var(--color-heat-red-bg)] text-[var(--color-heat-red-fg)]";
  if (tone === "yellow") return "bg-[var(--color-heat-yellow-bg)] text-[var(--color-heat-yellow-fg)]";
  if (tone === "none") return "bg-[var(--color-heat-none-bg)] text-[var(--color-heat-none-fg)]";
  return "bg-[var(--color-heat-orange-bg)] text-[var(--color-heat-orange-fg)]";
}

/** 체감온도 기준 색 (33°↑ 노랑 · 35°↑ 주황 · 38°↑ 빨강) */
function feelsTone(temp: number | null): HeatTone {
  if (temp == null) return "none";
  if (temp >= 38) return "red";
  if (temp >= 35) return "orange";
  if (temp >= 33) return "yellow";
  return "none";
}

function valueTone(tone: string) {
  if (tone === "red") return "text-[var(--color-heat-red-fg)]";
  if (tone === "yellow") return "text-[var(--color-heat-yellow-fg)]";
  if (tone === "orange") return "text-[var(--color-heat-orange-fg)]";
  return "text-[var(--color-text-value)]";
}

const COLS = "grid-cols-[142px_127px_150px_90px_90px_126px_1fr]";

function Photos({ row }: { row: HqRecordRow }) {
  if (row.photoUrls.length > 0) {
    return (
      <div className="flex gap-2">
        {row.photoUrls.slice(0, 2).map((url) => (
          <img key={url} src={url} alt="" className="size-8 rounded object-cover" />
        ))}
      </div>
    );
  }
  if (row.photoCount > 0) {
    return (
      <div className="flex gap-2">
        {Array.from({ length: Math.min(row.photoCount, 2) }).map((_, i) => (
          <div key={i} className="flex size-8 items-center justify-center rounded bg-[var(--color-bg-tile)] text-[var(--color-text-faint)]">
            ▧
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-[var(--color-text-faint)]">-</span>;
}

export default function RecordTable({ records }: { records: HqRecordRow[] }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
      <div className="min-w-[860px]">
        <div className={`grid h-[35px] ${COLS} items-center border-b border-[var(--color-border)] px-4 font-['JetBrains_Mono',monospace] text-[10px] font-bold tracking-[0.5px] text-[var(--color-text-faint)]`}>
          <span>사진</span>
          <span>유형</span>
          <span>장소</span>
          <span>온도</span>
          <span>습도</span>
          <span>체감온도</span>
          <span>시간</span>
        </div>
        {records.length === 0 && <p className="px-4 py-8 text-center text-sm text-[var(--color-text-faint)]">기록이 없어요.</p>}
        {records.map((r) => (
          <div key={r.id} className={`grid min-h-[53px] ${COLS} items-center border-b border-[var(--color-border)] px-4 text-[12px] last:border-b-0`}>
            <Photos row={r} />
            <span className="text-[var(--color-text-label)]">{r.type}</span>
            <span className="truncate pr-2 text-[var(--color-text-label)]">{r.place || r.teamName || "-"}</span>
            <span className="font-['JetBrains_Mono',monospace] text-[var(--color-text-value)]">{r.temperature != null ? `${r.temperature}°` : "-"}</span>
            <span className="font-['JetBrains_Mono',monospace] text-[var(--color-text-value)]">{r.humidity != null ? `${r.humidity}%` : "-"}</span>
            <span className={`font-['JetBrains_Mono',monospace] font-medium ${valueTone(feelsTone(r.apparentTemperature))}`}>
              {r.apparentTemperature != null ? `${r.apparentTemperature.toFixed(1)}°C` : "-"}
            </span>
            <span className="font-['JetBrains_Mono',monospace] text-[var(--color-text-body)]">{r.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatBadge({ temp, status, tone = "orange" }: { temp: string; status: string; tone?: string }) {
  return (
    <span className={`${toneClass(tone)} inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-medium whitespace-nowrap`}>
      {temp && (
        <>
          {temp}
          <span className="opacity-70">·</span>
        </>
      )}
      {status}
    </span>
  );
}

/** 온도·위험단계 배지. 위험단계가 0(미입력)이면 회색 "미입력" */
export function SiteHeatBadge({ temperature, label, tone }: { temperature: number | null; label: string; tone: HeatTone }) {
  if (tone === "none" && temperature == null) {
    return <span className="rounded bg-[var(--color-heat-none-bg)] px-2 py-0.5 text-[10px] text-[var(--color-heat-none-fg)]">미입력</span>;
  }
  return <HeatBadge temp={temperature != null ? `${temperature.toFixed(1)}°C` : ""} status={label} tone={tone} />;
}
