import { apiFetch } from "./client";
import { normalizeRecord } from "./records";
import type { BackendRecord, PrintSummaryResponse } from "./types";

interface BackendPrintSummary {
  date: string;
  site: { name?: string; address?: string; managerName?: string };
  weather: {
    temperature: number | null;
    humidity: number | null;
    apparentTemperature: number | null;
    heatLevel: number | null;
    skyStatus?: string | null;
    temperatureDelta?: number | null;
  } | null;
  records: BackendRecord[];
  checklist: { teamName: string; completed: number; total: number }[];
  approval: { manager?: { name?: string; approved?: boolean } | null; headOffice?: { name?: string; approved?: boolean } | null };
}

const HEAT_LEVEL_LABELS = ["정상", "폭염 주의보", "폭염 경보", "폭염 중대경보"];

export function getPrintSummary(date: string) {
  return apiFetch<BackendPrintSummary>("/api/v1/site/print-summary", { params: { date } }).then(
    (response): PrintSummaryResponse => {
      const weather: PrintSummaryResponse["weather"] = response.weather
        ? {
            temperature: response.weather.temperature,
            humidity: response.weather.humidity,
            feelsLike: response.weather.apparentTemperature ?? response.weather.temperature,
            heatWarningLevel:
              response.weather.heatLevel == null
                ? undefined
                : HEAT_LEVEL_LABELS[response.weather.heatLevel] ?? "미입력",
          }
        : null;

      const approvalLine: PrintSummaryResponse["approvalLine"] = [];
      if (response.approval.manager) {
        approvalLine.push({
          role: "담당",
          name: response.approval.manager.name ?? "",
          approved: response.approval.manager.approved ?? false,
        });
      }
      if (response.approval.headOffice) {
        approvalLine.push({
          role: "본사",
          name: response.approval.headOffice.name ?? "",
          approved: response.approval.headOffice.approved ?? false,
        });
      }

      return {
        date: response.date,
        site: {
          siteName: response.site.name ?? "",
          address: response.site.address,
          managerName: response.site.managerName,
        },
        weather,
        records: response.records.map(normalizeRecord),
        teamsChecklist: response.checklist,
        approvalLine,
      };
    },
  );
}
