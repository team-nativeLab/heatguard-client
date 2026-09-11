import { useState } from "react";
import { PrintIcon } from "../icons/Icons";
import RecordsTable, { DEFAULT_RECORDS, type RecordRow } from "./RecordsTable";
import PhotoLightbox from "./PhotoLightbox";
import { useToast } from "../ui/Toast";

const ALERT_LEVELS = [
  { label: "0 정상", bg: "bg-[#4ade80]/15", border: "border-[#16a34a]/25", text: "text-[#16a34a]" },
  { label: "1 주의보", bg: "bg-[#fbbf24]/15", border: "border-[#b45309]/25", text: "text-[#b45309]" },
  { label: "2 경보", bg: "bg-[#f97316]/15", border: "border-[#c2410c]/25", text: "text-[#c2410c]" },
  { label: "3 중대경보", bg: "bg-[#ef4444]/15", border: "border-[#dc2626]/25", text: "text-[#dc2626]" },
];

const TODAY_STATS = [
  { emoji: "📷", count: 16, label: "작업 사진", danger: false },
  { emoji: "☕", count: 8, label: "휴식 사진", danger: false },
  { emoji: "📋", count: 2, label: "현장 요청", danger: false },
  { emoji: "⚠", count: 1, label: "위험 알림", danger: true },
];

export default function DashboardOverview({ onEmergencyTest }: { onEmergencyTest?: () => void }) {
  const { showToast } = useToast();
  const [queryDate, setQueryDate] = useState("");
  const [lightboxRow, setLightboxRow] = useState<RecordRow | null>(null);

  const handlePrint = () => {
    showToast("인쇄 미리보기를 준비하고 있어요.");
  };

  const handleQuery = () => {
    showToast(queryDate ? `${queryDate} 기록을 조회했어요.` : "조회할 날짜를 선택해주세요.", queryDate ? "success" : "error");
  };

  return (
    <div className="w-full flex flex-col items-start">
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col">
          <div className="flex items-start justify-between w-full">
            <span className="bg-[var(--color-heat-badge-bg)] text-[#f97316] text-xs font-medium px-2.5 py-1 rounded-full">
              <span className="figma-emoji">☀</span> 폭염 경보
            </span>
            <button
              type="button"
              onClick={onEmergencyTest}
              className="bg-[var(--color-danger-soft-bg)] border border-[var(--color-modal-danger-border)] text-[var(--color-danger-text)] text-xs font-medium px-3 py-1.5 rounded hover:brightness-125 transition"
            >
              <span className="figma-emoji">🚨</span> 긴급호출 테스트
            </button>
          </div>
          <p className="text-[var(--color-text-body)] text-xs pt-4">현재 온도</p>
          <div className="flex gap-3 items-end pt-1">
            <span className="font-light text-[var(--color-text-heading)] text-6xl tracking-[-1.5px] leading-[60px]">
              36.2
            </span>
            <div className="flex items-center gap-2 pb-1">
              <span className="font-light text-[var(--color-text-heading)] text-2xl">°C</span>
              <span className="bg-[var(--color-delta-bg)] text-[var(--color-delta-fg)] text-xs rounded px-1.5 py-0.5">
                +1.2°C
              </span>
            </div>
          </div>
          <p className="text-[var(--color-text-body)] text-xs pt-2">습도 65% · 체감온도 36.2°C</p>

          <div className="border-[var(--color-border)] border-t grid grid-cols-3 gap-3 pt-3 mt-4 w-full">
            {[
              { label: "습도", value: "65%" },
              { label: "체감온도", value: "36.2°C" },
              { label: "날씨", value: "맑음" },
            ].map((item) => (
              <div key={item.label} className="bg-[var(--color-bg-app)] rounded-lg px-3 py-2">
                <p className="text-[var(--color-text-body)] text-[10px]">{item.label}</p>
                <p className="font-['JetBrains_Mono',monospace] text-[var(--color-text-value)] text-xs pt-0.5">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col">
          <div className="flex items-start justify-between w-full">
            <div>
              <p className="text-[var(--color-text-body)] text-sm">2026. 09. 05. (토)</p>
              <p className="font-light text-[var(--color-text-heading)] text-5xl tracking-[-1.2px] pt-1">05:23:44</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5 shrink-0">
              {ALERT_LEVELS.map((level) => (
                <span
                  key={level.label}
                  className={`${level.bg} border ${level.border} ${level.text} text-[10px] font-medium text-center rounded px-2 py-0.5 whitespace-nowrap`}
                >
                  {level.label}
                </span>
              ))}
            </div>
          </div>

          <div className="border-[var(--color-border)] border-t grid grid-cols-4 gap-3 pt-5 mt-5 w-full">
            {TODAY_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center py-2">
                <span className="figma-emoji text-2xl">{stat.emoji}</span>
                <p
                  className={`font-semibold text-3xl pt-2 ${
                    stat.danger ? "text-[var(--color-danger-text)]" : "text-[var(--color-text-heading)]"
                  }`}
                >
                  {stat.count}
                  <span className="text-base font-normal">건</span>
                </p>
                <p className="text-[var(--color-text-body)] text-[11px] pt-1.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-8 w-full">
        <h2 className="text-[var(--color-text-label)] text-sm font-medium">오늘의 기록</h2>
        <button
          type="button"
          onClick={handlePrint}
          className="border border-[var(--color-border)] flex gap-2 items-center px-3 py-1.5 rounded text-[var(--color-text-body)] text-sm hover:brightness-125 transition"
        >
          <PrintIcon className="size-4" />
          인쇄
        </button>
      </div>

      <div className="mt-3 w-full">
        <RecordsTable rows={DEFAULT_RECORDS} onPhotoClick={setLightboxRow} />
      </div>

      <div className="border-[var(--color-border)] border-t flex flex-col pt-8 mt-8 w-full">
        <h2 className="text-[var(--color-text-label)] text-sm font-medium">기록 조회</h2>
        <div className="flex gap-3 items-center pt-4 flex-wrap">
          <input
            type="date"
            value={queryDate}
            onChange={(e) => setQueryDate(e.target.value)}
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded h-[38px] w-[146px] px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors [color-scheme:var(--native-color-scheme)]"
          />
          <button
            type="button"
            onClick={handleQuery}
            className="bg-[var(--color-bg-tile)] text-[var(--color-text-label)] text-sm px-4 py-2 rounded hover:brightness-125 transition"
          >
            조회
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="border border-[var(--color-border)] text-[var(--color-text-body)] text-sm px-3 py-2 rounded hover:brightness-125 transition"
          >
            인쇄
          </button>
        </div>
      </div>

      {lightboxRow && (
        <PhotoLightbox
          takenAt={`2026.08.05 ${lightboxRow.time}`}
          siteName={`인천 복합물류센터 신축 · ${lightboxRow.place}`}
          onClose={() => setLightboxRow(null)}
        />
      )}
    </div>
  );
}
