import { RowViewIcon } from "../icons/Icons";

export interface RecordRow {
  type: string;
  place: string;
  temp: string;
  humidity: string;
  feels: string;
  feelsColor: string;
  time: string;
}

export default function RecordsTable({
  rows,
  onPhotoClick,
}: {
  rows: RecordRow[];
  onPhotoClick?: (row: RecordRow) => void;
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
          {rows.map((row, i) => (
            <tr key={i} className="border-[var(--color-border)] border-b last:border-b-0">
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onPhotoClick?.(row)}
                    className="bg-[var(--color-bg-tile)] flex items-center justify-center rounded size-8 hover:brightness-125 transition text-[var(--color-text-body)]"
                  >
                    <RowViewIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="bg-[var(--color-bg-tile)] flex items-center justify-center rounded size-8 opacity-30 text-[var(--color-text-body)]"
                  >
                    <RowViewIcon className="size-3.5" />
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 text-[var(--color-text-label)] text-xs">{row.type}</td>
              <td className="px-4 py-3 text-[var(--color-text-label)] text-xs">{row.place}</td>
              <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[var(--color-text-value)] text-xs">{row.temp}</td>
              <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[var(--color-text-value)] text-xs">{row.humidity}</td>
              <td className={`px-4 py-3 font-['JetBrains_Mono',monospace] font-medium text-xs ${row.feelsColor}`}>{row.feels}</td>
              <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[var(--color-text-body)] text-xs">{row.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const DEFAULT_RECORDS: RecordRow[] = [
  { type: "온도계", place: "3층 외벽", temp: "36°", humidity: "65%", feels: "36.2°C", feelsColor: "text-[#ea580c]", time: "09:02" },
  { type: "작업사진", place: "지하 배관", temp: "34°", humidity: "72%", feels: "34.5°C", feelsColor: "text-[#d97706]", time: "10:30" },
  { type: "휴식사진", place: "옥상 그늘막", temp: "38°", humidity: "80%", feels: "38.7°C", feelsColor: "text-[#dc2626]", time: "12:05" },
  { type: "온도계", place: "3층 외벽", temp: "35°", humidity: "60%", feels: "35.1°C", feelsColor: "text-[#ea580c]", time: "14:00" },
];
