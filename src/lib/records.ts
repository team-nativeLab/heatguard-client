import type { RecordItem } from "../api";
import type { RecordRow } from "../components/manager/RecordsTable";

export function feelsLikeColorClass(temp: number): string {
  if (temp >= 38) return "text-[#dc2626]";
  if (temp >= 35) return "text-[#ea580c]";
  if (temp >= 33) return "text-[#d97706]";
  return "text-[var(--color-text-value)]";
}

export function toRecordRow(item: RecordItem): RecordRow {
  const apparent = item.apparentTemperature ?? 0;
  return {
    id: item.id,
    photoUrl: item.photoUrl ?? null,
    teamName: item.teamName,
    type: item.type,
    place: item.place,
    temp: item.temperature != null ? `${item.temperature}°` : "-",
    humidity: item.humidity != null ? `${item.humidity}%` : "-",
    feels: `${apparent.toFixed(1)}°C`,
    feelsColor: feelsLikeColorClass(apparent),
    time: item.time,
  };
}
