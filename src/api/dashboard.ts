import { apiFetch } from "./client";
import type { DashboardResponse } from "./types";

interface BackendDashboard extends Omit<DashboardResponse, "heatLevel"> {
  heatLevel: number;
}

const HEAT_LEVEL_LABELS = ["정상", "폭염 주의보", "폭염 경보", "폭염 중대경보"];

export function getDashboard() {
  return apiFetch<BackendDashboard>("/api/v1/site/dashboard").then((response): DashboardResponse => ({
    ...response,
    heatLevel: HEAT_LEVEL_LABELS[response.heatLevel] ?? "미입력",
  }));
}
