import type { RecordRow } from "./RecordsTable";

export const DEFAULT_RECORDS: RecordRow[] = [
  { id: "d1", type: "온도계", place: "3층 외벽", temp: "36°", humidity: "65%", feels: "36.2°C", feelsColor: "text-[#ea580c]", time: "09:02" },
  { id: "d2", type: "작업사진", place: "지하 배관", temp: "34°", humidity: "72%", feels: "34.5°C", feelsColor: "text-[#d97706]", time: "10:30" },
  { id: "d3", type: "휴식사진", place: "옥상 그늘막", temp: "38°", humidity: "80%", feels: "38.7°C", feelsColor: "text-[#dc2626]", time: "12:05" },
  { id: "d4", type: "온도계", place: "3층 외벽", temp: "35°", humidity: "60%", feels: "35.1°C", feelsColor: "text-[#ea580c]", time: "14:00" },
];
