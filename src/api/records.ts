import { apiFetch } from "./client";
import type { Page, RecordDetail, RecordItem } from "./types";

export function listRecords(params?: { date?: string; cursor?: string }) {
  return apiFetch<Page<RecordItem>>("/api/v1/site/records", { params });
}

export function getRecord(recordId: string) {
  return apiFetch<RecordDetail>(`/api/v1/site/records/${recordId}`);
}
