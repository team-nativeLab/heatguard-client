import { useEffect, useState } from "react";
import { RowViewIcon } from "../icons/Icons";

export interface RecordRow {
  id: string;
  teamId?: string | null;
  photoUrl?: string | null;
  teamName?: string;
  type: string;
  place: string;
  temp: string;
  humidity: string;
  feels: string;
  feelsColor: string;
  time: string;
}

function RecordPhotoButton({ row, onPhotoClick }: { row: RecordRow; onPhotoClick?: (row: RecordRow) => void }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [row.photoUrl]);
  const available = Boolean(row.photoUrl) && !failed;

  return (
    <button
      type="button"
      onClick={() => available && onPhotoClick?.(row)}
      disabled={!available}
      aria-label={available ? "사진 크게 보기" : failed ? "사진을 불러오지 못했어요" : "사진 없음"}
      title={failed ? "사진을 불러오지 못했어요" : undefined}
      className={`flex items-center justify-center rounded-md size-8 overflow-hidden border border-[var(--color-border)] transition ${
        available
          ? "hover:border-[var(--color-accent)]"
          : "bg-[var(--color-bg-tile)] text-[var(--color-text-faint)] disabled:cursor-default"
      }`}
    >
      {available ? (
        <img src={row.photoUrl!} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : failed ? (
        <span aria-hidden="true" className="text-[10px] text-[var(--color-danger-text)]">!</span>
      ) : (
        <RowViewIcon className="size-3.5" />
      )}
    </button>
  );
}

export default function RecordsTable({
  rows,
  onRecordClick,
  emptyText = "기록이 없어요.",
}: {
  rows: RecordRow[];
  onRecordClick?: (row: RecordRow) => void;
  emptyText?: string;
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg overflow-x-auto w-full">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-[var(--color-border)] border-b font-['JetBrains_Mono',monospace] text-[var(--color-text-faint)] text-[10px] tracking-[0.5px]">
            <th className="px-4 py-2.5 font-bold">사진</th>
            <th className="px-4 py-2.5 font-bold">유형</th>
            <th className="px-4 py-2.5 font-bold">장소</th>
            <th className="px-4 py-2.5 font-bold">온도</th>
            <th className="px-4 py-2.5 font-bold">습도</th>
            <th className="px-4 py-2.5 font-bold">체감온도</th>
            <th className="px-4 py-2.5 font-bold">시간</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              role={onRecordClick ? "button" : undefined}
              tabIndex={onRecordClick ? 0 : undefined}
              aria-label={onRecordClick ? `${row.type}, ${row.place || "장소 미입력"}, ${row.time} 기록 상세 보기` : undefined}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("button")) return;
                onRecordClick?.(row);
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRecordClick?.(row);
                }
              }}
              className={`border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-tile)]/40 transition-colors ${onRecordClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]" : ""}`}
            >
              <td className="px-4 py-3"><RecordPhotoButton row={row} onPhotoClick={onRecordClick} /></td>
              <td className="px-4 py-3 text-[var(--color-text-label)] text-xs">{row.type}</td>
              <td className="px-4 py-3 text-[var(--color-text-label)] text-xs">
                {row.place}
                {row.teamName && <span className="text-[var(--color-text-faint)] ml-1.5">· {row.teamName}</span>}
              </td>
              <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[var(--color-text-value)] text-xs">{row.temp}</td>
              <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[var(--color-text-value)] text-xs">{row.humidity}</td>
              <td className={`px-4 py-3 font-['JetBrains_Mono',monospace] font-medium text-xs ${row.feelsColor}`}>{row.feels}</td>
              <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[var(--color-text-body)] text-xs">{row.time}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-text-faint)] text-sm">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export const DEFAULT_RECORDS: RecordRow[] = [
  { id: "d1", type: "온도계", place: "3층 외벽", temp: "36°", humidity: "65%", feels: "36.2°C", feelsColor: "text-[#ea580c]", time: "09:02" },
  { id: "d2", type: "작업사진", place: "지하 배관", temp: "34°", humidity: "72%", feels: "34.5°C", feelsColor: "text-[#d97706]", time: "10:30" },
  { id: "d3", type: "휴식사진", place: "옥상 그늘막", temp: "38°", humidity: "80%", feels: "38.7°C", feelsColor: "text-[#dc2626]", time: "12:05" },
  { id: "d4", type: "온도계", place: "3층 외벽", temp: "35°", humidity: "60%", feels: "35.1°C", feelsColor: "text-[#ea580c]", time: "14:00" },
];


