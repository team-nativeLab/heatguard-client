import { apiFetch } from "./client";
import type { PrintSummaryResponse } from "./types";

export function getPrintSummary(date: string) {
  return apiFetch<PrintSummaryResponse>("/api/v1/site/print-summary", { params: { date } });
}
